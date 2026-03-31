/**
 * Manual season refresh script (mirrors what the Vercel Cron Job does).
 *
 * Usage:
 *   node scripts/refresh-seasons.mjs              — refresh all games
 *   node scripts/refresh-seasons.mjs diablo4 poe2 — refresh specific games (not supported via cron endpoint, calls all)
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

// Load env from .env.local
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
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on process.env
  }
}

async function main() {
  await loadEnv();

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;
  const url = `${baseUrl}/api/cron/refresh-seasons`;

  if (!cronSecret) {
    console.warn("⚠️  CRON_SECRET is not set — request will be sent without auth (only works in local dev)");
  }

  console.log(`\n📡 Calling ${url}\n`);

  const headers = { "Content-Type": "application/json" };
  if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`;

  try {
    const res = await fetch(url, { headers });

    if (res.status === 401) {
      console.error("❌ Unauthorized — check that CRON_SECRET matches the server");
      process.exit(1);
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    console.log(`✅ Refreshed at: ${data.startedAt}\n`);
    console.log("Seasons:");
    for (const s of data.seasons) {
      const icon = s.error ? "❌" : s.status === "active" ? "🟢" : "🔵";
      console.log(`  ${icon} ${String(s.gameId).padEnd(20)} ${s.seasonName ?? ""}`);
      if (s.error) console.log(`     Error: ${s.error}`);
    }

    const news = data.news;
    if (typeof news === "object" && news.count !== undefined) {
      console.log(`\n📰 News: ${news.count} articles cached`);
    } else {
      console.log(`\n📰 News: ${news}`);
    }

    console.log();
  } catch (err) {
    console.error(`\n❌ Failed: ${err.message}`);
    console.error("   Make sure the Next.js server is running on", baseUrl);
    process.exit(1);
  }
}

main();
