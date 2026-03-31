import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { refreshSteamData } from "@/lib/steam-fetcher";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamGames = GAMES.filter((g) => g.steamAppId);
  const startedAt = new Date().toISOString();

  const results = await Promise.allSettled(
    steamGames.map((game) => refreshSteamData(game))
  );

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? { gameId: steamGames[i].id, players: r.value.currentPlayers }
      : { gameId: steamGames[i].id, error: (r.reason as Error)?.message ?? String(r.reason) }
  );

  return NextResponse.json({ startedAt, games: summary });
}
