import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { getCached, setCached } from "@/lib/cache";
import { STEAM_CACHE_KEY } from "@/lib/steam-fetcher";
import type { SteamData, PlayerSnapshot } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const STEAMCHARTS_URL = (appId: number) =>
  `https://steamcharts.com/app/${appId}/chart-data.json`;

const DEDUP_WINDOW_MS = 30 * 60 * 1000;
const HISTORY_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function mergeSnapshots(
  historical: PlayerSnapshot[],
  existing: PlayerSnapshot[],
): PlayerSnapshot[] {
  const all = [...historical, ...existing];
  all.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

  const deduped: PlayerSnapshot[] = [];
  let lastTs = 0;
  for (const snap of all) {
    const ts = new Date(snap.t).getTime();
    if (ts - lastTs >= DEDUP_WINDOW_MS) {
      deduped.push(snap);
      lastTs = ts;
    }
  }
  return deduped;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamGames = GAMES.filter((g) => g.steamAppId);
  const results: {
    gameId: string;
    appId: number;
    historical: number;
    merged: number;
    error?: string;
  }[] = [];

  for (const game of steamGames) {
    try {
      const res = await fetch(STEAMCHARTS_URL(game.steamAppId!), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        results.push({
          gameId: game.id,
          appId: game.steamAppId!,
          historical: 0,
          merged: 0,
          error: `SteamCharts ${res.status}`,
        });
        continue;
      }

      const raw = (await res.json()) as [number, number][];
      const historicalSnaps: PlayerSnapshot[] = raw.map(([ts, p]) => ({
        t: new Date(ts).toISOString(),
        p,
      }));

      const existing = await getCached<SteamData>(STEAM_CACHE_KEY(game.id));
      const existingSnaps = existing?.snapshots ?? [];

      const merged = mergeSnapshots(historicalSnaps, existingSnaps);

      if (existing) {
        const updated: SteamData = { ...existing, snapshots: merged };
        await setCached(STEAM_CACHE_KEY(game.id), updated, HISTORY_TTL_MS);
      } else {
        const now = new Date().toISOString();
        const lastSnap = merged[merged.length - 1];
        const steamData: SteamData = {
          gameId: game.id,
          steamAppId: game.steamAppId!,
          currentPlayers: lastSnap?.p ?? 0,
          peakPlayers7d: Math.max(...merged.slice(-168).map((s) => s.p), 0),
          snapshots: merged,
          rating: null,
          updatedAt: now,
        };
        await setCached(STEAM_CACHE_KEY(game.id), steamData, HISTORY_TTL_MS);
      }

      results.push({
        gameId: game.id,
        appId: game.steamAppId!,
        historical: historicalSnaps.length,
        merged: merged.length,
      });
    } catch (e) {
      results.push({
        gameId: game.id,
        appId: game.steamAppId!,
        historical: 0,
        merged: 0,
        error: (e as Error).message,
      });
    }
  }

  return NextResponse.json({
    seededAt: new Date().toISOString(),
    games: results,
  });
}
