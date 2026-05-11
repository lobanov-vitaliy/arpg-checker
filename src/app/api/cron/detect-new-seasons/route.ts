import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGames } from "@/config/games";
import { getGameSeasons } from "@/lib/games-db";
import {
  detectUpcomingSeasonFromAI,
  normalizeDateKey,
  type DetectionResult,
  type DetectorContext,
} from "@/lib/ai-fetcher";
import { findSeasonCandidates, type SteamNewsCandidate } from "@/lib/steam-news";
import {
  getAllPending,
  savePendingSeason,
  saveFlaggedSeason,
  PENDING_TTL_DAYS,
  PENDING_STALE_DAYS,
  FLAGGED_TTL_DAYS,
  type PendingEntry,
  type FlaggedEntry,
} from "@/lib/discovered-seasons";
import { sendTelegramMessage } from "@/lib/telegram";
import type { GameConfig, ManualSeasonEntry } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seasonpulse.fun";

// Detection windows.
const HARD_WINDOW_DAYS = 45; // always check when within this many days of endDate
const NO_END_RECHECK_DAYS = 30; // for open-ended seasons, force LLM check this often
const AVG_FRACTION = 0.5; // for seasons w/o endDate but with avgDuration

interface SeasonView {
  active: ManualSeasonEntry | null;
  recent: ManualSeasonEntry[];
  avgDurationDays: number | null;
}

function avgDuration(entries: ManualSeasonEntry[]): number | null {
  const completed = entries
    .filter((e) => e.endDate)
    .slice(0, 4)
    .map(
      (e) =>
        (Date.parse(e.endDate!) - Date.parse(e.startDate)) / 86_400_000
    )
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!completed.length) return null;
  return Math.round(completed.reduce((a, b) => a + b, 0) / completed.length);
}

function buildView(seasons: ManualSeasonEntry[]): SeasonView {
  const sorted = [...seasons].sort(
    (a, b) => Date.parse(b.startDate) - Date.parse(a.startDate)
  );
  const now = Date.now();
  const active =
    sorted.find((s) => {
      const start = Date.parse(s.startDate);
      const end = s.endDate ? Date.parse(s.endDate) : null;
      return start <= now && (end == null || end >= now);
    }) ??
    sorted.find((s) => Date.parse(s.startDate) <= now) ??
    null;
  return {
    active,
    recent: sorted.slice(0, 4),
    avgDurationDays: avgDuration(sorted),
  };
}

interface ShouldCallDecision {
  call: boolean;
  reason: string;
}

function shouldCallLLM(
  view: SeasonView,
  candidates: SteamNewsCandidate[],
  hasUpcomingKnown: boolean
): ShouldCallDecision {
  if (hasUpcomingKnown) {
    return { call: false, reason: "next season already known" };
  }
  if (candidates.length > 0) {
    return { call: true, reason: `Steam News candidate (score ${candidates[0].score})` };
  }
  const active = view.active;
  if (!active) return { call: true, reason: "no known active season" };

  if (active.endDate) {
    const daysLeft = (Date.parse(active.endDate) - Date.now()) / 86_400_000;
    if (daysLeft <= HARD_WINDOW_DAYS) {
      return { call: true, reason: `endDate in ${Math.round(daysLeft)}d` };
    }
    return { call: false, reason: `endDate in ${Math.round(daysLeft)}d, > ${HARD_WINDOW_DAYS}d` };
  }

  const elapsed = (Date.now() - Date.parse(active.startDate)) / 86_400_000;
  if (view.avgDurationDays) {
    const ratio = elapsed / view.avgDurationDays;
    if (ratio >= AVG_FRACTION) {
      return {
        call: true,
        reason: `${Math.round(elapsed)}d elapsed, ~${Math.round(ratio * 100)}% of avg`,
      };
    }
    return { call: false, reason: `only ${Math.round(ratio * 100)}% of avg duration elapsed` };
  }
  if (elapsed >= NO_END_RECHECK_DAYS) {
    return { call: true, reason: `${Math.round(elapsed)}d elapsed (no endDate, no avg)` };
  }
  return { call: false, reason: `only ${Math.round(elapsed)}d elapsed (no endDate)` };
}

function isDuplicate(
  result: Extract<DetectionResult, { announced: true }>,
  knownSeasons: ManualSeasonEntry[]
): boolean {
  const newKey = normalizeDateKey(result.startDate);
  for (const s of knownSeasons) {
    if (newKey && normalizeDateKey(s.startDate) === newKey) return true;
    if (
      result.seasonNumber != null &&
      s.seasonNumber != null &&
      result.seasonNumber === s.seasonNumber
    ) {
      return true;
    }
    if (
      s.seasonName.toLowerCase().trim() === result.seasonName.toLowerCase().trim()
    ) {
      return true;
    }
  }
  return false;
}

interface PerGameResult {
  game: GameConfig;
  status: "skipped" | "checked" | "found" | "duplicate" | "rejected" | "error";
  reason: string;
  candidatesCount: number;
  detection?: DetectionResult;
  pendingUuid?: string;
  error?: string;
}

async function processGame(
  game: GameConfig,
  pendingGameIds: Set<string>,
  dryRun: boolean
): Promise<PerGameResult> {
  if (pendingGameIds.has(game.id)) {
    return {
      game,
      status: "skipped",
      reason: "pending approval already exists",
      candidatesCount: 0,
    };
  }

  const seasons = await getGameSeasons(game.id);
  const view = buildView(seasons);

  const now = Date.now();
  const hasUpcomingKnown = seasons.some((s) => Date.parse(s.startDate) > now);

  let candidates: SteamNewsCandidate[] = [];
  try {
    candidates = await findSeasonCandidates(game);
  } catch (err) {
    console.warn(`[detect] steam news failed for ${game.id}:`, err);
  }

  const decision = shouldCallLLM(view, candidates, hasUpcomingKnown);
  if (!decision.call) {
    return {
      game,
      status: "skipped",
      reason: decision.reason,
      candidatesCount: candidates.length,
    };
  }

  const ctx: DetectorContext = {
    current: view.active,
    recent: view.recent,
    avgDurationDays: view.avgDurationDays,
    candidates,
  };

  let detection: DetectionResult;
  try {
    detection = await detectUpcomingSeasonFromAI(game, ctx);
  } catch (err) {
    return {
      game,
      status: "error",
      reason: decision.reason,
      candidatesCount: candidates.length,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!detection.announced) {
    // Validator rejected a model-claimed announcement — capture for review.
    if (detection.rejectedCandidate && !dryRun) {
      const flaggedAt = new Date();
      const flagged: FlaggedEntry = {
        uuid: crypto.randomUUID(),
        gameId: game.id,
        gameName: game.name,
        candidate: detection.rejectedCandidate,
        rejectReason: detection.reason,
        detectedAt: flaggedAt,
        expiresAt: new Date(flaggedAt.getTime() + FLAGGED_TTL_DAYS * 86_400_000),
      };
      try {
        await saveFlaggedSeason(flagged);
      } catch (err) {
        console.warn(`[detect] failed to save flagged for ${game.id}:`, err);
      }
    }
    return {
      game,
      status: "rejected",
      reason: detection.reason,
      candidatesCount: candidates.length,
      detection,
    };
  }

  if (isDuplicate(detection, seasons)) {
    return {
      game,
      status: "duplicate",
      reason: "matches existing season",
      candidatesCount: candidates.length,
      detection,
    };
  }

  const uuid = crypto.randomUUID();
  const detectedAt = new Date();
  const entry: PendingEntry = {
    uuid,
    gameId: game.id,
    gameName: game.name,
    season: {
      seasonName: detection.seasonName,
      seasonNumber: detection.seasonNumber ?? undefined,
      startDate: detection.startDate,
      endDate: detection.endDate,
      sourceUrl: detection.sourceUrl,
      confidence: detection.confidence,
    },
    detectedAt,
    expiresAt: new Date(detectedAt.getTime() + PENDING_TTL_DAYS * 86_400_000),
  };
  if (!dryRun) await savePendingSeason(entry);

  return {
    game,
    status: "found",
    reason: decision.reason,
    candidatesCount: candidates.length,
    detection,
    pendingUuid: uuid,
  };
}

function statusEmoji(s: PerGameResult["status"]): string {
  switch (s) {
    case "found":
      return "🆕";
    case "checked":
      return "✅";
    case "duplicate":
      return "🔁";
    case "rejected":
      return "🚫";
    case "skipped":
      return "⏭️";
    case "error":
      return "⚠️";
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const verbose = url.searchParams.get("verbose") === "1";
  const dryRun = url.searchParams.get("dryRun") === "1";
  const onlyGame = url.searchParams.get("gameId");
  const startedAt = new Date().toISOString();

  const [allGames, allPending] = await Promise.all([getGames(), getAllPending()]);
  const GAMES = onlyGame ? allGames.filter((g) => g.id === onlyGame) : allGames;
  if (onlyGame && GAMES.length === 0) {
    return NextResponse.json({ error: `gameId ${onlyGame} not found` }, { status: 404 });
  }
  const pendingGameIds = new Set(allPending.map((p) => p.gameId));

  const results = await Promise.all(
    GAMES.map((game) =>
      processGame(game, pendingGameIds, dryRun).catch((err): PerGameResult => ({
        game,
        status: "error",
        reason: "uncaught",
        candidatesCount: 0,
        error: err instanceof Error ? err.message : String(err),
      }))
    )
  );

  // Send approval requests for newly found seasons (skip in dry-run).
  for (const r of results) {
    if (dryRun) break;
    if (r.status !== "found" || !r.pendingUuid || !r.detection || !r.detection.announced) continue;
    const det = r.detection;
    const secret = process.env.CRON_SECRET ?? "";
    const approveUrl = `${SITE_URL}/api/admin/approve-season?id=${r.pendingUuid}&action=approve&token=${secret}`;
    const rejectUrl = `${SITE_URL}/api/admin/approve-season?id=${r.pendingUuid}&action=reject&token=${secret}`;

    const seasonNum = det.seasonNumber ? ` #${det.seasonNumber}` : "";
    const hasTime = det.startDate.includes("T");
    const startLine = hasTime
      ? `<b>Старт:</b> ${det.startDate}`
      : `<b>Старт:</b> ${det.startDate}\n⏰ <b>Без времени</b> — проверьте источник и при необходимости отредактируйте перед апрувом`;
    const msg =
      `🌐 <b>SeasonPulse</b> — 🎮 Новый сезон обнаружен!\n\n` +
      `<b>Игра:</b> ${r.game.name}\n` +
      `<b>Сезон:</b> ${det.seasonName}${seasonNum}\n` +
      `${startLine}\n` +
      `<b>Конец:</b> ${det.endDate ?? "неизвестно"}\n` +
      `<b>Источник:</b> ${det.sourceUrl}\n` +
      `<b>Достоверность:</b> ${det.confidence}\n` +
      `<i>Триггер: ${r.reason}</i>`;

    await sendTelegramMessage(msg, [
      [
        { text: "✅ Апрув", url: approveUrl },
        { text: "❌ Отклонить", url: rejectUrl },
      ],
    ]);
  }

  // Summary message.
  const flaggedResults = results.filter(
    (r) =>
      r.status === "rejected" &&
      r.detection &&
      !r.detection.announced &&
      r.detection.rejectedCandidate,
  );
  const counts = {
    found: results.filter((r) => r.status === "found").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    rejected: results.filter((r) => r.status === "rejected").length,
    duplicate: results.filter((r) => r.status === "duplicate").length,
    errors: results.filter((r) => r.status === "error").length,
    flagged: flaggedResults.length,
  };
  const llmCalls = counts.found + counts.rejected + counts.duplicate + counts.errors;

  // Pending entries older than PENDING_STALE_DAYS — operator forgot to approve;
  // they'll auto-expire at PENDING_TTL_DAYS, but warn before that happens.
  const staleCutoffMs = Date.now() - PENDING_STALE_DAYS * 86_400_000;
  const stalePending = allPending.filter(
    (p) => new Date(p.detectedAt).getTime() < staleCutoffMs,
  );

  const summaryHeader =
    `🌐 <b>SeasonPulse</b> — 🔍 Проверка новых сезонов\n` +
    `Игр: ${GAMES.length} | LLM: ${llmCalls} | Пропущено: ${counts.skipped}\n` +
    (counts.found > 0
      ? `🆕 Новых: ${counts.found} — отправлено на апрув ↑\n`
      : `✅ Новых анонсов не найдено\n`) +
    (counts.errors > 0 ? `⚠️ Ошибок: ${counts.errors}\n` : "") +
    (counts.rejected > 0 ? `🚫 Отбраковано валидатором: ${counts.rejected}\n` : "") +
    (counts.flagged > 0
      ? `🏳️ Flagged (модель сказала «да», валидатор отверг): ${counts.flagged} (TTL ${FLAGGED_TTL_DAYS}д)\n`
      : "") +
    (stalePending.length > 0
      ? `⌛ Pending без апрува > ${PENDING_STALE_DAYS}д: ${stalePending.length} (TTL ${PENDING_TTL_DAYS}д)\n`
      : "");

  const staleLines = stalePending.map((p) => {
    const ageDays = Math.floor((Date.now() - new Date(p.detectedAt).getTime()) / 86_400_000);
    return `⌛ <b>${p.gameName}</b>: ${p.season.seasonName} — ${ageDays}д без апрува`;
  });

  const flaggedLines = flaggedResults.flatMap((r) => {
    if (!r.detection || r.detection.announced || !r.detection.rejectedCandidate) return [];
    const c = r.detection.rejectedCandidate;
    return [
      `🏳️ <b>${r.game.name}</b>: ${c.seasonName} — ${c.startDate}\n   <i>${r.reason}</i> | src: ${c.sourceUrl || "(нет)"}`,
    ];
  });

  // Always include errors and detail-on-demand block.
  const detailLines = results
    .filter((r) => verbose || r.status === "error" || r.status === "rejected" || r.status === "found" || r.status === "duplicate")
    .map((r) => `${statusEmoji(r.status)} <b>${r.game.name}</b>: ${r.reason}${r.error ? ` — ${r.error}` : ""}`);
  const allLines = [...staleLines, ...flaggedLines, ...detailLines];
  const summaryMsg = allLines.length ? `${summaryHeader}\n${allLines.join("\n")}` : summaryHeader;
  if (!dryRun) await sendTelegramMessage(summaryMsg);

  return NextResponse.json({
    startedAt,
    counts,
    results: results.map((r) => ({
      gameId: r.game.id,
      status: r.status,
      reason: r.reason,
      candidatesCount: r.candidatesCount,
      ...(r.error ? { error: r.error } : {}),
      ...(r.detection ? { detection: r.detection } : {}),
    })),
  });
}
