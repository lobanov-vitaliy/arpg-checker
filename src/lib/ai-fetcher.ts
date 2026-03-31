import { openai } from "./openai";
import type { GameConfig, SeasonData, NewsArticle } from "@/types";

// ─── Season Fetcher ───────────────────────────────────────────────────────────

export async function fetchSeasonFromAI(game: GameConfig): Promise<SeasonData> {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are a data extraction assistant for ARPG games.

TODAY: ${today}
GAME: "${game.name}" by ${game.developer}
SEASON TYPE: ${game.seasonType}

TASK: Find the currently active ${game.seasonType} for this game as of ${today}.

STEP 1 — Search using ALL of these queries:
${game.searchHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}

STEP 2 — Also check: ${game.officialUrl}

STEP 3 — From search results, identify the CURRENTLY ACTIVE ${game.seasonType}:
- Its start date must be on or before ${today}
- Its end date must be after ${today}, OR it is the most recently started one with no announced end
- Do NOT return a ${game.seasonType} that already ended before ${today}
- If multiple results mention different season numbers, pick the HIGHEST numbered one that has already started

STEP 4 — Find the last 3-4 ${game.seasonType}s to compute average duration in days.

STEP 5 — Check if next ${game.seasonType} is officially announced. If not, estimate:
next_start ≈ current_start_date + avg_duration_days

Return ONLY this JSON object (no markdown, no explanation):
{
  "seasonName": "official name of the currently active ${game.seasonType}",
  "seasonNumber": 4,
  "status": "active",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD or null",
  "nextSeasonStartDate": "YYYY-MM-DD or null",
  "nextSeasonIsEstimated": true,
  "avgSeasonDurationDays": 91,
  "description": "1-2 sentence description of current ${game.seasonType} content/theme",
  "sourceUrl": "URL of source",
  "confidence": "high"
}

Field rules:
- status: "active" | "upcoming" | "ended" | "unknown"
- confidence: "high" = official announcement, "medium" = reliable community source, "low" = uncertain
- nextSeasonIsEstimated: false if officially announced, true if you calculated it
- All dates must be YYYY-MM-DD or null — no other format
- seasonNumber: integer or null`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) throw new Error(`No text response from AI for game: ${game.id}`);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Could not extract JSON for ${game.id}. Response: ${text.slice(0, 200)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    gameId: game.id,
    seasonName: parsed.seasonName ?? "Unknown",
    seasonNumber:
      typeof parsed.seasonNumber === "number" ? parsed.seasonNumber : undefined,
    status: parsed.status ?? "unknown",
    startDate: parsed.startDate ?? null,
    endDate: parsed.endDate ?? null,
    nextSeasonStartDate: parsed.nextSeasonStartDate ?? null,
    nextSeasonIsEstimated: parsed.nextSeasonIsEstimated ?? true,
    avgSeasonDurationDays:
      typeof parsed.avgSeasonDurationDays === "number"
        ? parsed.avgSeasonDurationDays
        : null,
    description: parsed.description ?? undefined,
    sourceUrl: parsed.sourceUrl ?? undefined,
    confidence: parsed.confidence ?? "low",
    fetchedAt: new Date().toISOString(),
  };
}

// ─── News Fetcher ─────────────────────────────────────────────────────────────

export async function fetchNewsFromAI(
  gameNames: string[]
): Promise<NewsArticle[]> {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const prompt = `Find 10-15 recent ARPG news articles published between ${sevenDaysAgo} and ${today}.

Games: ${gameNames.join(", ")}

Search queries:
1. Diablo IV Diablo III news latest patch season
2. Path of Exile Path of Exile 2 news latest league
3. Last Epoch Lost Ark Torchlight Undecember news latest
4. ARPG season patch update announcement

Sources: official game blogs, PCGamesN, Kotaku, IGN, PC Gamer, Reddit game subreddits.

Return ONLY a JSON array (no other text):
[
  {
    "title": "string",
    "summary": "2-3 sentence summary",
    "url": "https://...",
    "publishedAt": "YYYY-MM-DD or null",
    "gameId": "diablo4 | diablo3 | diablo2r | poe1 | poe2 | lastepoch | torchlight_infinite | undecember | lost_ark | null",
    "gameName": "string or null",
    "source": "string",
    "tags": ["string"]
  }
]`;

  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const articles = JSON.parse(jsonMatch[0]) as Omit<NewsArticle, "id">[];
    return articles.map((a, i) => ({
      ...a,
      id: `${Date.now()}-${i}`,
      tags: Array.isArray(a.tags) ? a.tags : [],
    }));
  } catch {
    return [];
  }
}
