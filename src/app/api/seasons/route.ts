import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { fetchSeasonFromAI } from "@/lib/ai-fetcher";
import { getCached, setCached, CACHE_KEYS } from "@/lib/cache";
import type { SeasonData } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  const results = await Promise.allSettled(
    GAMES.map(async (game): Promise<SeasonData> => {
      const cacheKey = CACHE_KEYS.season(game.id);
      const cached = await getCached<SeasonData>(cacheKey);
      if (cached) return cached;

      const data = await fetchSeasonFromAI(game);
      await setCached(cacheKey, data);
      return data;
    })
  );

  const seasons: SeasonData[] = results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      gameId: GAMES[i].id,
      seasonName: "Data unavailable",
      status: "unknown" as const,
      startDate: null,
      endDate: null,
      confidence: "low" as const,
      fetchedAt: now.toISOString(),
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });

  return NextResponse.json({
    seasons,
    cachedAt: now.toISOString(),
    nextRefresh: new Date(now.getTime() + 3_600_000).toISOString(),
  });
}
