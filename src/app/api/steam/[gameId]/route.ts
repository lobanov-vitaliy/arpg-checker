import { NextRequest, NextResponse } from "next/server";
import { getSteamData } from "@/lib/steam-fetcher";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const data = await getSteamData(gameId);
  if (!data) return NextResponse.json(null);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
