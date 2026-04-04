import { NextRequest, NextResponse } from "next/server";
import { getGameSeasons, addSeason } from "@/lib/games-db";
import type { ManualSeasonEntry } from "@/types";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId } = await params;
  const seasons = await getGameSeasons(gameId);
  return NextResponse.json(seasons);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId } = await params;
  const body = await req.json() as ManualSeasonEntry;
  if (!body.seasonName || !body.startDate || !body.confidence) {
    return NextResponse.json({ error: "seasonName, startDate, confidence are required" }, { status: 400 });
  }
  await addSeason(gameId, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
