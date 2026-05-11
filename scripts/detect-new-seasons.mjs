/**
 * Manual run of the new-season detector (mirrors the Vercel Cron Job).
 *
 * Usage:
 *   node scripts/detect-new-seasons.mjs                  — full run, all games
 *   node scripts/detect-new-seasons.mjs --dry            — no DB writes, no Telegram
 *   node scripts/detect-new-seasons.mjs --game=poe2      — only one game
 *   node scripts/detect-new-seasons.mjs --verbose        — include skipped games in summary
 *   node scripts/detect-new-seasons.mjs --dry --verbose --game=diablo4
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_BASE_URL=http://localhost:3000   (or your prod URL)
 *   CRON_SECRET=your-secret                      (must match the server)
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  try {
    const envFile = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

async function main() {
  await loadEnv();

  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
  const kv = Object.fromEntries(
    args
      .filter((a) => a.startsWith("--") && a.includes("="))
      .map((a) => a.slice(2).split("="))
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  const params = new URLSearchParams();
  if (flags.has("--dry")) params.set("dryRun", "1");
  if (flags.has("--verbose")) params.set("verbose", "1");
  if (kv.game) params.set("gameId", kv.game);

  const qs = params.toString();
  const url = `${baseUrl}/api/cron/detect-new-seasons${qs ? `?${qs}` : ""}`;

  console.log(`\n📡 ${url}\n`);

  const headers = { "Content-Type": "application/json" };
  if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`;

  const t0 = Date.now();
  const res = await fetch(url, { headers });
  const ms = Date.now() - t0;

  if (res.status === 401) {
    console.error("❌ Unauthorized — check CRON_SECRET");
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}: ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`✅ ${ms}ms | started ${data.startedAt}`);
  console.log("counts:", data.counts);
  console.log();
  for (const r of data.results) {
    const tag =
      r.status === "found"
        ? "🆕"
        : r.status === "rejected"
          ? "🚫"
          : r.status === "duplicate"
            ? "🔁"
            : r.status === "error"
              ? "⚠️"
              : r.status === "skipped"
                ? "⏭️"
                : "✅";
    console.log(`${tag} ${r.gameId.padEnd(20)} cands=${r.candidatesCount} | ${r.reason}`);
    if (r.detection && r.detection.announced) {
      console.log(
        `     → ${r.detection.seasonName}${
          r.detection.seasonNumber ? ` #${r.detection.seasonNumber}` : ""
        } | start ${r.detection.startDate} | ${r.detection.sourceUrl}`
      );
    }
    if (r.error) console.log(`     ! ${r.error}`);
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
