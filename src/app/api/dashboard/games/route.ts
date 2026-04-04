import { NextRequest, NextResponse } from "next/server";
import { getSeasonsPerGameForIds } from "@/lib/seasons";
import { getLikesCountsForIds } from "@/lib/likes";
import { getSteamDataForIds } from "@/lib/steam-fetcher";
import type { GameFullData } from "@/types";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams
    .get("ids")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  if (!ids.length) return NextResponse.json({});

  const [seasonsMap, likesMap, steamMap] = await Promise.all([
    getSeasonsPerGameForIds(ids),
    getLikesCountsForIds(ids),
    getSteamDataForIds(ids),
  ]);

  const result: Record<string, GameFullData> = {};
  for (const id of ids) {
    result[id] = {
      seasons: seasonsMap[id] ?? [],
      likes: likesMap[id] ?? 0,
      steam: steamMap[id] ?? null,
    };
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
