import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { GameDoc } from "@/lib/games-db";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const c = db.collection<GameDoc>("games");
  const docs = await c.find({}, { projection: { id: 1, seasons: 1 } }).toArray();

  const patched: { gameId: string; startDate: string; endDate: string }[] = [];

  for (const doc of docs) {
    const seasons = doc.seasons ?? [];
    const byStartDesc = [...seasons].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    for (const s of seasons) {
      if (s.endDate) continue;
      const newer = byStartDesc.find(
        (o) => new Date(o.startDate).getTime() > new Date(s.startDate).getTime()
      );
      if (!newer) continue;
      await c.updateOne(
        { id: doc.id, "seasons.startDate": s.startDate },
        { $set: { "seasons.$.endDate": newer.startDate } }
      );
      patched.push({ gameId: doc.id, startDate: s.startDate, endDate: newer.startDate });
    }
  }

  return NextResponse.json({ ok: true, patched });
}
