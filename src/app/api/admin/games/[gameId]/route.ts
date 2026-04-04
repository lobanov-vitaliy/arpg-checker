import { NextRequest, NextResponse } from "next/server";
import { getGame, getGameSeasons, updateGame, deleteGame } from "@/lib/games-db";

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
  const [game, seasons] = await Promise.all([getGame(gameId), getGameSeasons(gameId)]);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...game, seasons });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId } = await params;
  const body = await req.json();
  await updateGame(gameId, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId } = await params;
  await deleteGame(gameId);
  return NextResponse.json({ ok: true });
}
