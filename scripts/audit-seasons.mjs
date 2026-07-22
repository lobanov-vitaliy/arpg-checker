/**
 * Season audit — reads the live MongoDB `games` collection and flags, per game,
 * whether the stored seasons look stale, mistimed, or inconsistent. NO LLM and NO
 * network beyond Mongo: it only applies deterministic heuristics, then prints a
 * report plus a machine-readable JSON block listing which games to verify online.
 *
 * The `/check-seasons` slash command runs this, then web-verifies the flagged
 * games using each game's `searchHints` and proposes add/update actions.
 *
 * Usage:
 *   node scripts/audit-seasons.mjs                 — audit every game
 *   node scripts/audit-seasons.mjs --game=diablo4  — audit one game
 *   node scripts/audit-seasons.mjs --all           — list ALL games to verify, not just flagged
 *   node scripts/audit-seasons.mjs --json          — emit only the JSON block
 *
 * Requires MONGODB_URI in .env.local.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  try {
    const envFile = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

const DAY = 86_400_000;
const hasTime = (d) => typeof d === "string" && d.includes("T");
const ts = (d) => (d ? Date.parse(d) : NaN);
const daysBetween = (a, b) => Math.round((ts(a) - ts(b)) / DAY);
const fmtDays = (n) => (Number.isFinite(n) ? `${n}d` : "?");

function median(nums) {
  const a = nums.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

/**
 * Heuristically assess one game. Returns { status, flags[], latest, cadenceDays }.
 * status: "stale" (DB likely behind reality) | "check" (verify online) | "ok".
 */
function assess(game, now) {
  const seasons = [...(game.seasons ?? [])].sort((a, b) => ts(b.startDate) - ts(a.startDate));
  const flags = [];
  if (seasons.length === 0) {
    return { status: "stale", flags: [{ level: "alert", msg: "no seasons stored at all" }], latest: null, cadenceDays: null };
  }

  const latest = seasons[0];
  // Typical season length, from historical start-to-start gaps (robust median).
  const gaps = [];
  for (let i = 0; i < seasons.length - 1; i++) {
    const g = daysBetween(seasons[i].startDate, seasons[i + 1].startDate);
    if (Number.isFinite(g) && g > 0) gaps.push(g);
  }
  const cadenceDays = median(gaps);

  const startInFuture = ts(latest.startDate) > now;
  const ended = latest.endDate != null;
  const ageDays = daysBetween(new Date(now).toISOString(), latest.startDate);

  // 1) The newest stored season already ended → a newer one almost certainly exists.
  if (ended && ts(latest.endDate) < now) {
    flags.push({
      level: "alert",
      msg: `newest stored season "${latest.seasonName}" ended ${fmtDays(daysBetween(new Date(now).toISOString(), latest.endDate))} ago — a newer season is likely missing`,
    });
  }
  // 2) Ongoing season running well past the usual cadence → probably superseded.
  if (!ended && !startInFuture && cadenceDays && ageDays > cadenceDays * 1.35) {
    flags.push({
      level: "alert",
      msg: `ongoing season is ${fmtDays(ageDays)} old vs ~${cadenceDays}d cadence — likely a new season already started`,
    });
  }
  // 3) Current/upcoming season stored without a launch time.
  if ((startInFuture || !ended) && !hasTime(latest.startDate)) {
    flags.push({
      level: "warn",
      msg: `current/upcoming season "${latest.seasonName}" has no launch time (startDate="${latest.startDate}")`,
    });
  }
  // 4) Upcoming season already in DB — good, just confirm it's right.
  if (startInFuture) {
    flags.push({ level: "info", msg: `upcoming season already stored, starts ${latest.startDate} (verify date/time)` });
  }
  // 5) Chain consistency: an older season's endDate should equal the next
  //    (newer) season's startDate. seasons[] is newest-first, so the older one
  //    is seasons[i+1] and the newer one is seasons[i].
  for (let i = 0; i < seasons.length - 1; i++) {
    const newer = seasons[i];
    const older = seasons[i + 1];
    if (older.endDate == null) continue; // older season left open — skip
    if (ts(older.endDate) !== ts(newer.startDate)) {
      flags.push({
        level: "warn",
        msg: `chain gap: "${older.seasonName}".endDate(${older.endDate}) ≠ "${newer.seasonName}".startDate(${newer.startDate})`,
      });
    }
  }
  // 6) Soft metadata gaps on the newest season.
  if (!latest.sourceUrl) flags.push({ level: "info", msg: `newest season has no sourceUrl` });
  if (!latest.description) flags.push({ level: "info", msg: `newest season has no description` });
  if (latest.confidence && latest.confidence !== "high")
    flags.push({ level: "info", msg: `newest season confidence="${latest.confidence}"` });

  const status = flags.some((f) => f.level === "alert")
    ? "stale"
    : flags.some((f) => f.level === "warn")
      ? "check"
      : "ok";

  return { status, flags, latest, cadenceDays };
}

async function main() {
  await loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not set (.env.local)");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
  const kv = Object.fromEntries(
    args.filter((a) => a.startsWith("--") && a.includes("=")).map((a) => a.slice(2).split("="))
  );
  const jsonOnly = flags.has("--json");
  const includeAll = flags.has("--all");

  const client = new MongoClient(uri);
  await client.connect();
  const filter = kv.game ? { id: kv.game } : {};
  const games = await client
    .db("seasonpulse")
    .collection("games")
    .find(filter, { projection: { _id: 0, id: 1, name: 1, seasonType: 1, seasons: 1, searchHints: 1, officialUrl: 1 } })
    .toArray();
  await client.close();

  const now = Date.now();
  const report = games
    .map((g) => ({ game: g, ...assess(g, now) }))
    .sort((a, b) => {
      const rank = { stale: 0, check: 1, ok: 2 };
      return rank[a.status] - rank[b.status] || a.game.id.localeCompare(b.game.id);
    });

  const counts = { stale: 0, check: 0, ok: 0 };
  for (const r of report) counts[r.status]++;

  if (!jsonOnly) {
    const icon = { stale: "🔴", check: "🟡", ok: "🟢" };
    console.log(`\n📊 Season audit — ${games.length} games | 🔴 ${counts.stale} stale  🟡 ${counts.check} check  🟢 ${counts.ok} ok\n`);
    for (const r of report) {
      const L = r.latest;
      const head = L ? `${L.seasonName ?? "?"}${L.seasonNumber ? ` #${L.seasonNumber}` : ""} · ${L.startDate} → ${L.endDate ?? "live"}` : "(no seasons)";
      console.log(`${icon[r.status]} ${r.game.id.padEnd(20)} ${head}`);
      for (const f of r.flags) {
        const fi = f.level === "alert" ? "  ‼" : f.level === "warn" ? "  ›" : "  ·";
        console.log(`${fi} ${f.msg}`);
      }
    }
    console.log();
  }

  // Machine-readable block: which games the agent should verify online, with hints.
  const toVerify = report
    .filter((r) => includeAll || r.status !== "ok")
    .map((r) => ({
      id: r.game.id,
      name: r.game.name,
      status: r.status,
      latest: r.latest
        ? { seasonName: r.latest.seasonName, seasonNumber: r.latest.seasonNumber ?? null, startDate: r.latest.startDate, endDate: r.latest.endDate ?? null }
        : null,
      cadenceDays: r.cadenceDays,
      reasons: r.flags.filter((f) => f.level !== "info").map((f) => f.msg),
      searchHints: r.game.searchHints ?? [],
      officialUrl: r.game.officialUrl ?? null,
    }));

  console.log("```json AUDIT");
  console.log(JSON.stringify({ generatedAt: new Date(now).toISOString(), counts, toVerify }, null, 2));
  console.log("```");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
