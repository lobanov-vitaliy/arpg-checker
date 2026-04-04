import { NextRequest, NextResponse } from "next/server";
import { addFeedback } from "@/lib/feedback";
import type { FeedbackType } from "@/lib/feedback";
import { sendTelegramMessage } from "@/lib/telegram";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { type, text } = body as { type?: string; text?: string };
  if (type !== "idea" && type !== "game") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (typeof text !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ip = clientIp(req);
  const result = await addFeedback(type as FeedbackType, text, ip);

  if (!result.ok) {
    const status = result.error === "rate_limit" ? 429 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const typeLabel = type === "idea" ? "💡 Ідея" : "🎮 Нова гра";
  await sendTelegramMessage(
    `🌐 <b>SeasonPulse</b> — ${typeLabel}\n\n${text}`
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
