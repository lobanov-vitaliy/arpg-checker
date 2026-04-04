import { NextRequest, NextResponse } from "next/server";
import { getAllFeedback } from "@/lib/feedback";

function auth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getAllFeedback();
  return NextResponse.json(entries);
}
