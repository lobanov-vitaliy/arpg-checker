import { openai } from "./openai";
import type { GameConfig, SeasonData } from "@/types";

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
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD or null",
  "nextSeasonStartDate": "YYYY-MM-DD or null",
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
- All dates: YYYY-MM-DD or null — no other format
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

export async function detectUpcomingSeasonFromAI(
  game: GameConfig,
  currentSeasonName: string
): Promise<
  | { announced: false }
  | {
      announced: true;
      seasonName: string;
      seasonNumber: number | null;
      startDate: string;
      endDate: string | null;
      sourceUrl: string;
      confidence: "high" | "medium" | "low";
    }
> {
  const today = new Date().toISOString().split("T")[0];
  const year = today.slice(0, 4);

  const prompt = `Today is ${today}. Game: "${game.name}" by ${game.developer}. Season type: ${game.seasonType}.
Current known ${game.seasonType}: "${currentSeasonName}".

Search the web for: "${game.name} next ${game.seasonType} official start date ${year}"
Also check: ${game.officialUrl}

Has the NEXT ${game.seasonType} (after "${currentSeasonName}") been OFFICIALLY announced with a confirmed start date by the developer?
- Only count official developer announcements, NOT speculation or estimates
- The next ${game.seasonType} must have a start date AFTER today (${today})
- Do NOT return the current ${game.seasonType} "${currentSeasonName}"

Return ONLY valid JSON, no markdown:
If no official announcement found: {"announced": false}
If found: {"announced": true, "seasonName": "exact name", "seasonNumber": 14, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD or null", "sourceUrl": "URL", "confidence": "high"}

confidence: "high" = official dev source, "medium" = reliable community source, "low" = uncertain`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) return { announced: false };

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { announced: false };

  try {
    const p = JSON.parse(jsonMatch[0]);
    if (!p.announced) return { announced: false };
    if (!p.startDate || new Date(p.startDate) <= new Date(today)) {
      return { announced: false };
    }
    return {
      announced: true,
      seasonName: String(p.seasonName ?? "Unknown"),
      seasonNumber: typeof p.seasonNumber === "number" ? p.seasonNumber : null,
      startDate: String(p.startDate),
      endDate: typeof p.endDate === "string" ? p.endDate : null,
      sourceUrl: typeof p.sourceUrl === "string" ? p.sourceUrl : game.officialUrl,
      confidence: (p.confidence as "high" | "medium" | "low") ?? "low",
    };
  } catch {
    return { announced: false };
  }
}

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
