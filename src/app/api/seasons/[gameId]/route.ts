import { NextResponse } from "next/server";
import { getGame } from "@/config/games";
import { fetchSeasonFromAI } from "@/lib/ai-fetcher";
import { setCached, CACHE_KEYS } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const game = getGame(gameId);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  try {
    const seasonData = await fetchSeasonFromAI(game);
    await setCached(CACHE_KEYS.season(game.id), seasonData);
    return NextResponse.json(seasonData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 500 }
    );
  }
}
