import { NextRequest, NextResponse } from "next/server";
import { updateSeason, deleteSeason } from "@/lib/games-db";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string; startDate: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId, startDate } = await params;
  const body = await req.json();
  await updateSeason(gameId, decodeURIComponent(startDate), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string; startDate: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gameId, startDate } = await params;
  await deleteSeason(gameId, decodeURIComponent(startDate));
  return NextResponse.json({ ok: true });
}
