/**
 * Daily season refresh script
 * Usage:
 *   node scripts/refresh-seasons.mjs              — refresh all games
 *   node scripts/refresh-seasons.mjs diablo4 poe2 — refresh specific games
 *
 * Schedule with Windows Task Scheduler or cron:
 *   0 6 * * * cd /path/to/arpg-checker && node scripts/refresh-seasons.mjs
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
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    // .env.local not found — rely on process.env
  }
}

async function clearCache(gameId) {
  const cacheFile = path.join(ROOT, ".cache", `season_${gameId}.json`);
  try {
    await fs.unlink(cacheFile);
    console.log(`  ✓ Cleared cache for ${gameId}`);
  } catch {
    // File didn't exist — that's fine
  }
}

async function main() {
  await loadEnv();

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set");
    process.exit(1);
  }

  // Determine which games to refresh
  const args = process.argv.slice(2);
  const ALL_GAME_IDS = [
    "diablo4",
    "diablo2r",
    "poe1",
    "poe2",
    "lastepoch",
    "torchlight_infinite",
    "undecember",
    "lost_ark",
  ];
  const gameIds = args.length > 0 ? args : ALL_GAME_IDS;

  const invalid = gameIds.filter((id) => !ALL_GAME_IDS.includes(id));
  if (invalid.length) {
    console.error(`❌ Unknown game IDs: ${invalid.join(", ")}`);
    console.error(`   Valid IDs: ${ALL_GAME_IDS.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🔄 Refreshing seasons for: ${gameIds.join(", ")}\n`);

  // Clear cache files so the next request triggers a fresh AI fetch
  for (const gameId of gameIds) {
    await clearCache(gameId);
  }

  // Trigger the API endpoint to fetch fresh data from AI
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/api/seasons`;

  console.log(`📡 Calling ${url} to warm up the cache...\n`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();

    console.log("✅ Results:\n");
    for (const season of data.seasons) {
      const icon = season.error
        ? "❌"
        : season.status === "active"
          ? "🟢"
          : "🔵";
      console.log(`  ${icon} ${season.gameId.padEnd(12)} ${season.seasonName}`);
      if (season.endDate) console.log(`     Ends: ${season.endDate}`);
      if (season.error) console.log(`     Error: ${season.error}`);
    }

    console.log(`\n⏰ Next refresh suggested: ${data.nextRefresh}\n`);
  } catch (err) {
    console.error(`\n❌ Failed to call API: ${err.message}`);
    console.error("   Make sure the Next.js server is running on", baseUrl);
    process.exit(1);
  }
}

main();
