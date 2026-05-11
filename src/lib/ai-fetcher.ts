import { openai } from "./openai";
import type { GameConfig, ManualSeasonEntry, SeasonData } from "@/types";
import type { SteamNewsCandidate } from "./steam-news";

// ─── Season Fetcher ───────────────────────────────────────────────────────────

export async function fetchSeasonsFromAI(
  games: GameConfig[]
): Promise<SeasonData[]> {
  // Individual requests in parallel — batching caused wrong season data
  const results = await Promise.allSettled(
    games.map((game) => fetchSeasonFromAI(game))
  );

  return results.map((result, i) =>
    result.status === "fulfilled"
      ? result.value
      : makeErrorSeason(games[i].id, result.reason)
  );
}

export async function fetchSeasonFromAI(game: GameConfig): Promise<SeasonData> {
  const today = new Date().toISOString().split("T")[0];

  const year = today.slice(0, 4);

  const prompt = `You are a live game data assistant. Today is ${today}.

GAME: "${game.name}" by ${game.developer}
SEASON TYPE: ${game.seasonType}

## Step 1 — Search the web using ALL of these queries (run each search):
${game.searchHints.map((h, i) => `Query ${i + 1}: ${h} ${year}`).join("\n")}

Also check the official page: ${game.officialUrl}

## Step 2 — Identify the CURRENTLY ACTIVE ${game.seasonType} as of ${today}
Cross-reference results from all searches. Pick the one with the most recent startDate that is ≤ ${today}.

MANDATORY CHECKS:
- startDate must be ≤ ${today}
- endDate (if known) must be > ${today}
- Take the HIGHEST season/league number whose startDate ≤ ${today}
- Any ${game.seasonType} that started before ${year} is almost certainly outdated — verify carefully
- Trust search results over your training data — the web search is live

## Step 3 — Compute average duration
From search results find 3–4 previous ${game.seasonType}s and calculate average duration in days.

## Step 4 — Estimate next start if not announced
If next ${game.seasonType} start is not officially announced: nextStart = currentStartDate + avgDurationDays

Return ONLY this JSON (no markdown, no extra text):
{
  "seasonName": "exact official name",
  "seasonNumber": 5,
  "status": "active",
  "startDate": "YYYY-MM-DDTHH:mm:ssZ",
  "endDate": "YYYY-MM-DDTHH:mm:ssZ or null",
  "nextSeasonStartDate": "YYYY-MM-DDTHH:mm:ssZ or null",
  "nextSeasonIsEstimated": true,
  "avgSeasonDurationDays": 91,
  "description": "1-2 sentences about this season's theme or content",
  "sourceUrl": "URL of the source you used",
  "confidence": "high"
}

Field rules:
- status: "active" | "upcoming" | "ended" | "unknown"
- confidence: "high" = official source, "medium" = community wiki/reddit, "low" = uncertain
- nextSeasonIsEstimated: false only if officially announced, true if you calculated it
- Dates: prefer full ISO 8601 in UTC ("YYYY-MM-DDTHH:mm:ssZ") when the exact
  start/end time is published (convert from the source's local timezone to UTC).
  If only the calendar date is known, return "YYYY-MM-DD". Use null if unknown.
  Never invent a time — only include HH:mm:ss if it comes from the source.
- seasonNumber: integer or null`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) throw new Error(`No text response for ${game.id}`);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON in response for ${game.id}: ${text.slice(0, 200)}`);
  }

  const p = JSON.parse(jsonMatch[0]);

  return {
    gameId: game.id,
    seasonName: String(p.seasonName ?? "Unknown"),
    seasonNumber: typeof p.seasonNumber === "number" ? p.seasonNumber : undefined,
    status: (p.status as SeasonData["status"]) ?? "unknown",
    startDate: (p.startDate as string) ?? null,
    endDate: (p.endDate as string) ?? null,
    nextSeasonStartDate: (p.nextSeasonStartDate as string) ?? null,
    nextSeasonIsEstimated: Boolean(p.nextSeasonIsEstimated ?? true),
    avgSeasonDurationDays:
      typeof p.avgSeasonDurationDays === "number" ? p.avgSeasonDurationDays : null,
    description: typeof p.description === "string" ? p.description : undefined,
    sourceUrl: typeof p.sourceUrl === "string" ? p.sourceUrl : undefined,
    confidence: (p.confidence as SeasonData["confidence"]) ?? "low",
    fetchedAt: new Date().toISOString(),
  };
}

// ─── New Season Detector ─────────────────────────────────────────────────────

// Raw model output (post-parse, pre-validation) — captured when the model
// claimed a new season but our validators rejected it, so an operator can
// review false negatives later.
export interface RejectedCandidate {
  seasonName: string;
  seasonNumber: number | null;
  startDate: string;
  endDate: string | null;
  sourceUrl: string;
  confidence: string;
}

export type DetectionResult =
  | { announced: false; reason: string; rejectedCandidate?: RejectedCandidate }
  | {
      announced: true;
      seasonName: string;
      seasonNumber: number | null;
      startDate: string;
      endDate: string | null;
      sourceUrl: string;
      confidence: "high" | "medium" | "low";
    };

export interface DetectorContext {
  current: ManualSeasonEntry | null;
  recent: ManualSeasonEntry[]; // up to 4 most recent (incl. current)
  avgDurationDays: number | null;
  // Optional pre-fetched Steam News candidates to focus the search.
  candidates?: SteamNewsCandidate[];
}

function hostnameOf(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Source must come from the developer's own domain or known social/community channels.
function isAcceptableSource(url: string, game: GameConfig): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  const officialHost = hostnameOf(game.officialUrl);
  if (officialHost && (host === officialHost || host.endsWith(`.${officialHost}`))) {
    return true;
  }
  const social = game.socialLinks ?? {};
  const socialHosts = [social.twitter, social.discord, social.reddit, social.youtube, social.twitch]
    .map((u) => (u ? hostnameOf(u) : null))
    .filter(Boolean) as string[];
  if (socialHosts.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  // Steam Community announcements are first-party.
  if (host === "store.steampowered.com" || host === "steamcommunity.com") return true;
  // Common news domains for Blizzard / GGG / Bungie / Activision etc.
  const knownPublishers = [
    "news.blizzard.com",
    "blizzard.com",
    "pathofexile.com",
    "pathofexile2.com",
    "bungie.net",
    "callofduty.com",
    "activision.com",
    "ea.com",
    "ubisoft.com",
    "warframe.com",
    "destinythegame.com",
  ];
  if (knownPublishers.some((d) => host === d || host.endsWith(`.${d}`))) return true;
  return false;
}

function normalizeDateKey(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = Date.parse(s);
  if (isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

function buildDetectionPrompt(
  game: GameConfig,
  ctx: DetectorContext,
  today: string
): string {
  const year = today.slice(0, 4);
  const nextYear = String(Number(year) + 1);
  const current = ctx.current;
  const recentLines = ctx.recent
    .map(
      (s) =>
        `  - ${s.seasonName}${s.seasonNumber ? ` (#${s.seasonNumber})` : ""} | ${s.startDate} → ${s.endDate ?? "open"}`
    )
    .join("\n");

  const currentBlock = current
    ? `Current ${game.seasonType}:
  name: "${current.seasonName}"${current.seasonNumber ? ` (#${current.seasonNumber})` : ""}
  startDate: ${current.startDate}
  endDate: ${current.endDate ?? "unknown"}`
    : `No known active ${game.seasonType} in our database.`;

  const avgBlock =
    ctx.avgDurationDays != null
      ? `Average ${game.seasonType} duration so far: ~${ctx.avgDurationDays} days.`
      : "";

  const searchQueries = game.searchHints
    .map((h, i) => `  ${i + 1}. ${h}`)
    .join("\n");

  const candidateBlock = ctx.candidates && ctx.candidates.length
    ? `\nPRIORITY LEADS (Steam News, last 21 days, looks season-related):
${ctx.candidates
  .map(
    (c, i) =>
      `  [${i + 1}] ${c.publishedAt.slice(0, 10)} | ${c.item.feedlabel}\n      title: ${c.item.title}\n      url: ${c.item.url}`
  )
  .join("\n")}
Open and read these URLs first — they are usually the announcement.`
    : "";

  return `You are an analyst verifying whether the NEXT ${game.seasonType} of "${game.name}" by ${game.developer} has been OFFICIALLY announced.
Today: ${today}.

KNOWN HISTORY (newest first):
${recentLines || "  (none)"}

${currentBlock}
${avgBlock}
${candidateBlock}

REQUIRED SEARCH QUERIES (run each — also try ${year} and ${nextYear} variants):
${searchQueries}
Also visit: ${game.officialUrl}

Cross-reference results. An announcement counts ONLY if ALL of these hold:
  1. The source is the developer / publisher (official site, official Steam announcement, official social channel) — NOT fan wikis, leaks, datamines, or speculation.
  2. A specific start date is published (a calendar date — month + day; year may be implicit).
  3. The start date is STRICTLY AFTER today (${today}).
  4. The announced ${game.seasonType} is NOT identical to the current one above. Its seasonNumber (if any) must be greater than the current's${current?.seasonNumber ? ` (${current.seasonNumber})` : ""}, OR its name and start date must clearly differ.

Reply with ONE JSON object, no markdown, no commentary.

If announced:
{"announced": true, "seasonName": "exact official name", "seasonNumber": 14 or null, "startDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ", "endDate": "YYYY-MM-DD or null", "sourceUrl": "URL of the announcement", "confidence": "high" | "medium"}

If not announced, or if you cannot meet ALL four conditions:
{"announced": false, "reason": "<one short sentence explaining what's missing>"}

TIME EXTRACTION (MANDATORY when any launch time appears in the source):
- Most modern ARPGs publish a specific launch time alongside the date. Actively
  search the announcement text — including image captions and tweet replies —
  for any of these patterns:
    "<H>(:MM)? <AM|PM>? <TZ>"           e.g. "1 PM PT", "8:00 PM EDT", "13:00 UTC"
    "live at <time>", "release time", "goes live", "starts at"
    "<UTC offset>"                       e.g. "20:00 UTC", "00:00 GMT"
- If you find ANY time, convert it to UTC and return "YYYY-MM-DDTHH:mm:ssZ".
  Example: "Friday, May 22 at 5 PM Pacific" → "2026-05-23T00:00:00Z".
- Studio defaults to check if the post hints at "usual time": GGG = 13:00 PT,
  Blizzard = 17:00 PT, CDPR = 18:00 UTC. Only use these if the source itself
  references a recurring/standard launch slot — never invent.
- Fall back to calendar-date "YYYY-MM-DD" ONLY when the source publishes no
  time at all. Never invent a time.

Date format rules:
- Use full ISO UTC ("YYYY-MM-DDTHH:mm:ssZ") whenever a time is published.
- Use calendar-date "YYYY-MM-DD" only when no time is anywhere in the source.
- If the year was implicit in the source (e.g. "March 6"), use the closest future year that makes startDate > today.
confidence: "high" = the announcement is on the developer's own domain; "medium" = announced via official social channel / Steam announcement.`;
}

export async function detectUpcomingSeasonFromAI(
  game: GameConfig,
  ctx: DetectorContext
): Promise<DetectionResult> {
  const today = new Date().toISOString().split("T")[0];
  const prompt = buildDetectionPrompt(game, ctx, today);

  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) return { announced: false, reason: "empty model response" };

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { announced: false, reason: "no JSON in response" };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return { announced: false, reason: "invalid JSON" };
  }

  if (!parsed.announced) {
    return {
      announced: false,
      reason: typeof parsed.reason === "string" ? parsed.reason : "no announcement",
    };
  }

  // Model claimed an announcement — capture its raw output so we can keep a
  // "flagged" record even when our validators reject it below.
  const rawCandidate: RejectedCandidate = {
    seasonName: String(parsed.seasonName ?? "Unknown").trim(),
    seasonNumber: typeof parsed.seasonNumber === "number" ? parsed.seasonNumber : null,
    startDate: typeof parsed.startDate === "string" ? parsed.startDate : "",
    endDate: typeof parsed.endDate === "string" ? parsed.endDate : null,
    sourceUrl: typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : "",
    confidence: typeof parsed.confidence === "string" ? parsed.confidence : "low",
  };

  const startDate = parsed.startDate;
  if (typeof startDate !== "string") {
    return { announced: false, reason: "missing startDate", rejectedCandidate: rawCandidate };
  }
  const startTs = Date.parse(startDate);
  if (isNaN(startTs)) {
    return { announced: false, reason: "unparseable startDate", rejectedCandidate: rawCandidate };
  }
  if (startTs <= Date.parse(today)) {
    return {
      announced: false,
      reason: `startDate ${startDate} not in future`,
      rejectedCandidate: rawCandidate,
    };
  }

  const sourceUrl = typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : "";
  if (!sourceUrl || !isAcceptableSource(sourceUrl, game)) {
    return {
      announced: false,
      reason: `source ${sourceUrl || "(missing)"} not on developer/social whitelist`,
      rejectedCandidate: rawCandidate,
    };
  }

  const confidence = parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low";
  if (confidence === "low") {
    return { announced: false, reason: "confidence too low", rejectedCandidate: rawCandidate };
  }

  // seasonNumber sanity check vs current.
  const seasonNumber = typeof parsed.seasonNumber === "number" ? parsed.seasonNumber : null;
  if (
    seasonNumber != null &&
    ctx.current?.seasonNumber != null &&
    seasonNumber <= ctx.current.seasonNumber
  ) {
    return {
      announced: false,
      reason: `seasonNumber ${seasonNumber} ≤ current ${ctx.current.seasonNumber}`,
      rejectedCandidate: rawCandidate,
    };
  }

  // Name must differ from current.
  const seasonName = String(parsed.seasonName ?? "Unknown").trim();
  if (
    ctx.current &&
    seasonName.toLowerCase() === ctx.current.seasonName.toLowerCase() &&
    normalizeDateKey(startDate) === normalizeDateKey(ctx.current.startDate)
  ) {
    return {
      announced: false,
      reason: "matches current season",
      rejectedCandidate: rawCandidate,
    };
  }

  return {
    announced: true,
    seasonName,
    seasonNumber,
    startDate,
    endDate: typeof parsed.endDate === "string" ? parsed.endDate : null,
    sourceUrl,
    confidence,
  };
}

export { normalizeDateKey };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeErrorSeason(gameId: string, reason: unknown): SeasonData {
  return {
    gameId,
    seasonName: "Data unavailable",
    status: "unknown",
    startDate: null,
    endDate: null,
    confidence: "low",
    fetchedAt: new Date().toISOString(),
    error: reason instanceof Error ? reason.message : String(reason),
  };
}
