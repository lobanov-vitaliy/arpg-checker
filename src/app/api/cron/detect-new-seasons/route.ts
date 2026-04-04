import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGames } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { detectUpcomingSeasonFromAI } from "@/lib/ai-fetcher";
import {
  getDiscoveredSeasons,
  getAllPending,
  savePendingSeason,
  type PendingEntry,
} from "@/lib/discovered-seasons";
import { sendTelegramMessage } from "@/lib/telegram";
import type { SeasonData, ManualSeasonEntry } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";

function shouldCheck(
  seasons: SeasonData[],
  discovered: ManualSeasonEntry[]
): boolean {
  const allStatuses = [
    ...seasons.map((s) => s.status),
    ...discovered.map((e) => {
      const now = Date.now();
      if (new Date(e.startDate).getTime() > now) return "upcoming";
      if (e.endDate && new Date(e.endDate).getTime() < now) return "ended";
      return "active";
    }),
  ];
  if (allStatuses.includes("upcoming")) return false;

  const active = seasons.find((s) => s.status === "active");
  if (!active) return true;

  if (active.endDate) {
    const daysLeft = (new Date(active.endDate).getTime() - Date.now()) / 86400000;
    return daysLeft <= 21;
  }

  if (active.avgSeasonDurationDays && active.startDate) {
    const elapsed = (Date.now() - new Date(active.startDate).getTime()) / 86400000;
    return elapsed > active.avgSeasonDurationDays * 0.7;
  }

  return false;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const GAMES = await getGames();

  const allPending = await getAllPending();
  const gamesWithPending = new Set(allPending.map((p) => p.gameId));

  const gameChecks = await Promise.all(
    GAMES.map(async (game) => {
      const [seasons, discovered] = await Promise.all([
        getSeasonsForGame(game.id),
        getDiscoveredSeasons(game.id),
      ]);
      return { game, seasons, discovered };
    })
  );

  const toCheck = gameChecks.filter(
    ({ game, seasons, discovered }) =>
      !gamesWithPending.has(game.id) && shouldCheck(seasons, discovered)
  );

  const results = await Promise.allSettled(
    toCheck.map(async ({ game, seasons }) => {
      const currentSeason =
        seasons.find((s) => s.status === "active") ??
        seasons.find((s) => s.status === "upcoming") ??
        seasons[0];
      const currentName = currentSeason?.seasonName ?? "Unknown";
      const result = await detectUpcomingSeasonFromAI(game, currentName);
      return { game, result };
    })
  );

  const newFound: string[] = [];

  for (const settled of results) {
    if (settled.status === "rejected") continue;
    const { game, result } = settled.value;
    if (!result.announced) continue;

    const [discovered, staticSeasons] = await Promise.all([
      getDiscoveredSeasons(game.id),
      getSeasonsForGame(game.id),
    ]);
    const knownDates = new Set([
      ...staticSeasons.map((s) => s.startDate),
      ...discovered.map((e) => e.startDate),
    ]);
    if (knownDates.has(result.startDate)) continue;

    const uuid = crypto.randomUUID();
    const entry: PendingEntry = {
      uuid,
      gameId: game.id,
      gameName: game.name,
      season: {
        seasonName: result.seasonName,
        seasonNumber: result.seasonNumber ?? undefined,
        startDate: result.startDate,
        endDate: result.endDate,
        sourceUrl: result.sourceUrl,
        confidence: result.confidence,
      },
      detectedAt: new Date().toISOString(),
    };

    await savePendingSeason(entry);

    const secret = process.env.CRON_SECRET ?? "";
    const approveUrl = `${SITE_URL}/api/admin/approve-season?id=${uuid}&action=approve&token=${secret}`;
    const rejectUrl = `${SITE_URL}/api/admin/approve-season?id=${uuid}&action=reject&token=${secret}`;

    const seasonNum = result.seasonNumber ? ` #${result.seasonNumber}` : "";
    const msg =
      `🌐 <b>SeasonPulse</b> — 🎮 Новый сезон обнаружен!\n\n` +
      `<b>Игра:</b> ${game.name}\n` +
      `<b>Сезон:</b> ${result.seasonName}${seasonNum}\n` +
      `<b>Старт:</b> ${result.startDate}\n` +
      `<b>Конец:</b> ${result.endDate ?? "неизвестно"}\n` +
      `<b>Источник:</b> ${result.sourceUrl}\n` +
      `<b>Достоверность:</b> ${result.confidence}`;

    await sendTelegramMessage(msg, [
      [
        { text: "✅ Апрув", url: approveUrl },
        { text: "❌ Отклонить", url: rejectUrl },
      ],
    ]);

    newFound.push(`${game.name}: ${result.seasonName}`);
  }

  const skippedCount = GAMES.length - toCheck.length;
  const summaryMsg =
    `🌐 <b>SeasonPulse</b> — 🔍 Проверка новых сезонов\n` +
    `Проверено: ${toCheck.length} | Пропущено: ${skippedCount}\n` +
    (newFound.length > 0
      ? `🆕 Новых: ${newFound.length} — отправлено на апрув ↑`
      : `✅ Новых анонсов не найдено`);

  await sendTelegramMessage(summaryMsg);

  return NextResponse.json({
    startedAt,
    checked: toCheck.length,
    skipped: skippedCount,
    newFound: newFound.length,
    games: newFound,
  });
}
