import { openai } from "./openai";
import type { GameConfig, SeasonData, NewsArticle } from "@/types";

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
    model: "gpt-4o-mini",
    tools: [{ type: "web_search" }],
    input: prompt,
  });

  const text = response.output_text;
  if (!text) throw new Error(`No text response from AI for game: ${game.id}`);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Could not extract JSON for ${game.id}. Response: ${text.slice(0, 200)}`,
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
