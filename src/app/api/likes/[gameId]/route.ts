import { NextRequest, NextResponse } from "next/server";
import { getLikesCount, toggleLike } from "@/lib/likes";
import { getGame } from "@/config/games";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!await getGame(gameId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const count = await getLikesCount(gameId);
  return NextResponse.json({ count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!await getGame(gameId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ip = clientIp(req);
  const result = await toggleLike(gameId, ip);
  return NextResponse.json(result);
}
