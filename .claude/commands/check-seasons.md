---
description: Audit the live Mongo season DB, web-verify flagged games, and propose add/update actions
argument-hint: "[gameId]  (optional — audit a single game, e.g. diablo4)"
allowed-tools: Bash(node scripts/audit-seasons.mjs:*), Bash(npm run audit:*), WebSearch, WebFetch, Read
---

You are auditing the live season database for this project and reporting which games
have a **new season** that is missing or whose stored season is **out of date / mistimed**.

Seasons live in MongoDB (`seasonpulse.games`, each game doc has a `seasons[]` array).
The JSON files under `src/data/games/*.json` are only a bootstrap seed — **Mongo is the
source of truth**. Today's date is provided in the environment; trust it over your training cutoff.

## Step 1 — Run the deterministic audit

```
node scripts/audit-seasons.mjs $ARGUMENTS
```
(no argument → all games; `diablo4` → just that game.)

This applies local heuristics only — it does NOT touch the internet. Read its human
report, then parse the fenced ` ```json AUDIT ` block at the end. Each entry in
`toVerify` has: `id`, `name`, `status` (`stale`|`check`), `latest` (the newest stored
season), `cadenceDays` (typical season length), `reasons`, `searchHints`, `officialUrl`.

Heuristic meaning:
- 🔴 **stale** — the newest stored season already ended, or an ongoing one has run well
  past the game's normal cadence → a newer season is probably live and missing from the DB.
- 🟡 **check** — usually a current/upcoming season stored **without a launch time**, or a
  chain gap (one season's `endDate` ≠ the next season's `startDate`).
- 🟢 **ok** — not in `toVerify`; skip unless `--all` was used.

## Step 2 — Verify flagged games online

For **every** game in `toVerify`, confirm against the internet. Prioritise 🔴 stale first.

1. Run each of the game's `searchHints` as a `WebSearch` query (also try the current and
   next year). Also consider fetching `officialUrl`.
2. Only trust **official** sources: the developer/publisher site, official Steam
   announcement, or an official social channel. Ignore fan wikis, leaks, datamines, speculation.
3. Determine the **real current season** and the **next announced season** (if any), with
   exact start **date and time**.

**Per-game official source shortcuts** (prefer these over web search when available):
- **the_bazaar** — official seasons API returns exact data: `WebFetch https://playthebazaar.com/api/Seasons`.
  Each entry has `name` (= season number, e.g. "Season 15"), `title` (= the season name we store,
  e.g. "Summer Sparks"), `start`/`end` (full ISO with time), and `isCurrentlyActive`. Ignore far-future
  placeholder rows (end dates years out / `title: "TBD"`). This is authoritative — no web search needed.

**Date/time rules (match `src/lib/ai-fetcher.ts`):**
- If the source publishes a launch time, convert it to UTC and use full ISO
  `YYYY-MM-DDTHH:mm:ssZ`. Search image captions and tweet replies for times like
  "1 PM PT", "live at", "goes live", "20:00 UTC".
- Studio default slots — use ONLY if the source itself references a standard/recurring time:
  GGG = 13:00 PT, Blizzard = 17:00 PT, CDPR = 18:00 UTC.
- Fall back to date-only `YYYY-MM-DD` only when no time appears anywhere. Never invent a time.
- If a year is implicit, pick the closest future year that keeps `startDate` after today.

## Step 3 — Report

**Write the entire report to the user in Ukrainian** (verdicts, notes, and the Proposed
actions list). Keep game IDs, season names, dates/times, URLs, and the action keywords
(`add`/`update`) verbatim — only the surrounding prose is Ukrainian.

Group findings into a concise report. For each game state the verdict against the DB:

- 🆕 **New season missing** — a newer season is live/announced but not stored. Give its
  name, number, exact start (date+time UTC), source URL, confidence
  (`high` = developer's own domain, `medium` = official social/Steam).
- 🕒 **Date/time wrong** — stored season exists but start date or time is off. Show
  `stored → correct` and the source.
- ✅ **Up to date** — DB matches reality (note if only a missing time/description remains).
- ❓ **Unconfirmed** — flagged by heuristics but you could not find an official source.
  Say what you checked; do not guess.

End with a **Proposed actions** list — one concrete, ready-to-apply change per line, e.g.:
- `add` diablo4 → "Season of Foo" #15, start `2026-09-29T17:00:00Z`, source <url> (closes #14)
- `update` cs2 → set startDate `2026-01-21T19:00:00Z` (add launch time), source <url>

## Step 4 — Apply only on approval

Do **not** write to the DB until the user picks which actions to apply. When they approve,
apply via a short Node script (mirroring `addSeason` / `updateSeason` in
`src/lib/games-db.ts`) against `seasonpulse.games`:
- **add**: push the new season at array position 0, and set the previously-open season's
  `endDate` to the new `startDate` (use the exact same string).
- **update**: match the season by its current `startDate` and `$set` the changed fields.
Load `MONGODB_URI` from `.env.local`. After applying, re-run `node scripts/audit-seasons.mjs $ARGUMENTS`
to confirm the affected games are no longer flagged. Never invent data — only write what an
official source confirmed.
