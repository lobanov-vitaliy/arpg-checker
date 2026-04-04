import { NextRequest, NextResponse } from "next/server";
import {
  getPendingSeason,
  deletePendingSeason,
  saveDiscoveredSeason,
} from "@/lib/discovered-seasons";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

function html(body: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SeasonPulse Admin</title>
    <style>body{font-family:sans-serif;background:#111;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .box{text-align:center;padding:2rem;border-radius:1rem;background:#1a1a2e;border:1px solid #333}
    h1{font-size:2rem;margin-bottom:.5rem}p{color:#aaa}</style></head>
    <body><div class="box">${body}</div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  if (!token || token !== process.env.CRON_SECRET) {
    return html("<h1>❌</h1><p>Unauthorized</p>");
  }
  if (!id || (action !== "approve" && action !== "reject")) {
    return html("<h1>❌</h1><p>Invalid request</p>");
  }

  const entry = await getPendingSeason(id);
  if (!entry) {
    return html("<h1>⚠️</h1><p>Запись не найдена (уже обработана?)</p>");
  }

  await deletePendingSeason(id);

  if (action === "approve") {
    await saveDiscoveredSeason(entry.gameId, entry.season);
    await sendTelegramMessage(
      `✅ <b>Апрувнуто:</b> ${entry.gameName} — ${entry.season.seasonName} (${entry.season.startDate})`
    );
    const seasonNum = entry.season.seasonNumber
      ? ` #${entry.season.seasonNumber}`
      : "";
    return html(
      `<h1>✅ Сохранено!</h1><p>${entry.gameName}: ${entry.season.seasonName}${seasonNum}</p><p style="margin-top:1rem;font-size:.875rem">Сезон добавлен на сайт.</p>`
    );
  } else {
    await sendTelegramMessage(
      `❌ <b>Отклонено:</b> ${entry.gameName} — ${entry.season.seasonName} (${entry.season.startDate})`
    );
    return html(
      `<h1>❌ Отклонено</h1><p>${entry.gameName}: ${entry.season.seasonName}</p>`
    );
  }
}
