import { NextRequest, NextResponse } from "next/server";
import { getGames, createGame } from "@/lib/games-db";
import type { GameDoc } from "@/lib/games-db";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const games = await getGames();
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as GameDoc;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  await createGame({ ...body, seasons: body.seasons ?? [] });
  return NextResponse.json({ ok: true }, { status: 201 });
}
