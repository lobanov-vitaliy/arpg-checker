import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { fetchSeasonFromAI } from "@/lib/ai-fetcher";
import { setCached, CACHE_KEYS } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — enough for all games in parallel

export async function GET(request: Request) {
  // Vercel automatically sends CRON_SECRET as Bearer token for cron invocations.
  // Allow unauthenticated access only in local dev (no CRON_SECRET set).
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  // Refresh all seasons in parallel
  const seasonResults = await Promise.allSettled(
    GAMES.map(async (game) => {
      const season = await fetchSeasonFromAI(game);
      await setCached(CACHE_KEYS.season(game.id), season);
      return { gameId: game.id, seasonName: season.seasonName, status: season.status };
    })
  );

  const seasons = seasonResults.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { gameId: GAMES[i].id, error: (r.reason as Error)?.message ?? String(r.reason) }
  );

  return NextResponse.json({ startedAt, seasons });
}
