import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { fetchSeasonsFromAI } from "@/lib/ai-fetcher";
import { getCached, setCached, CACHE_KEYS } from "@/lib/cache";
import type { SeasonData } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

// Refresh window: if season ends within this many days, re-fetch
const REFRESH_WINDOW_DAYS = 7;

function needsRefresh(cached: SeasonData | null): boolean {
  // No data yet
  if (!cached) return true;

  // Previous fetch errored
  if (cached.error) return true;

  // Status unknown — always retry
  if (cached.status === "unknown") return true;

  // Season already ended — check for next season data
  if (cached.status === "ended") return true;

  // No end date — re-fetch weekly (use fetchedAt as proxy)
  if (!cached.endDate) {
    const fetchedAt = new Date(cached.fetchedAt).getTime();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return fetchedAt < weekAgo;
  }

  // End date within REFRESH_WINDOW_DAYS — re-fetch so we catch the new season
  const daysUntilEnd =
    (new Date(cached.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilEnd <= REFRESH_WINDOW_DAYS) return true;

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

  // Force-refresh all (ignore smart logic) when ?force=1
  const force = new URL(request.url).searchParams.get("force") === "1";

  const startedAt = new Date().toISOString();

  // Load all cached data in parallel
  const cached = await Promise.all(
    GAMES.map((g) => getCached<SeasonData>(CACHE_KEYS.season(g.id)))
  );

  // Decide which games need a refresh
  const toRefresh = GAMES.filter((_g, i) => force || needsRefresh(cached[i]));
  const skipped = GAMES.filter((_g, i) => !force && !needsRefresh(cached[i]));

  // Fetch only stale games
  const freshSeasons =
    toRefresh.length > 0 ? await fetchSeasonsFromAI(toRefresh) : [];

  // Persist fresh results
  await Promise.all(freshSeasons.map((s) => setCached(CACHE_KEYS.season(s.gameId), s)));

  // Build full response: fresh + skipped (from cache)
  const allSeasons = GAMES.map((g, i) => {
    const fresh = freshSeasons.find((s) => s.gameId === g.id);
    return fresh ?? cached[i];
  });

  return NextResponse.json({
    startedAt,
    refreshed: toRefresh.length,
    skipped: skipped.length,
    seasons: allSeasons?.map((s) => ({
      gameId: s?.gameId ?? "",
      seasonName: s?.seasonName ?? "",
      status: s?.status ?? "unknown",
      endDate: s?.endDate ?? null,
      refreshed: !!freshSeasons.find((f) => f.gameId === s?.gameId),
      ...(s?.error ? { error: s.error } : {}),
    })),
  });
}
