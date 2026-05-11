import { getDb } from "./mongodb";
import { addSeason } from "./games-db";
import type { ManualSeasonEntry } from "@/types";
import type { RejectedCandidate } from "./ai-fetcher";

// Pending detections auto-expire after this window so a missed Telegram approval
// does not block re-detection of the same game forever.
export const PENDING_TTL_DAYS = 7;
// Entries older than this trigger a "stale" warning in the cron summary, before
// they're actually dropped by the TTL index.
export const PENDING_STALE_DAYS = 3;

export interface PendingEntry {
  uuid: string;
  gameId: string;
  gameName: string;
  season: ManualSeasonEntry;
  detectedAt: Date;
  expiresAt: Date;
}

async function pendingCol() {
  const db = await getDb();
  const c = db.collection<PendingEntry>("pending_seasons");
  await Promise.all([
    c.createIndex({ uuid: 1 }, { unique: true, background: true }),
    c.createIndex({ gameId: 1 }, { background: true }),
    c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true }),
  ]);
  return c;
}

// Approved seasons go directly into games.seasons in the games collection.
// getDiscoveredSeasons returns [] — kept for backward compat with dedup checks.
export async function getDiscoveredSeasons(
  _gameId: string
): Promise<ManualSeasonEntry[]> {
  return [];
}

// On approve: save directly into games.seasons (permanent, visible immediately).
export async function saveDiscoveredSeason(
  gameId: string,
  entry: ManualSeasonEntry
): Promise<void> {
  await addSeason(gameId, entry);
}

export async function getAllPending(): Promise<PendingEntry[]> {
  const c = await pendingCol();
  return c.find({}, { sort: { detectedAt: -1 } }).toArray();
}

export async function savePendingSeason(entry: PendingEntry): Promise<void> {
  const c = await pendingCol();
  await c.insertOne(entry);
}

export async function getPendingSeason(
  uuid: string
): Promise<PendingEntry | null> {
  const c = await pendingCol();
  return c.findOne({ uuid });
}

export async function deletePendingSeason(uuid: string): Promise<void> {
  const c = await pendingCol();
  await c.deleteOne({ uuid });
}

// ─── Flagged seasons ─────────────────────────────────────────────────────────
// Captures detections the model claimed but our validators rejected (e.g. source
// not on whitelist, confidence too low). Kept for ~2 weeks so an operator can
// spot anything we missed.
export const FLAGGED_TTL_DAYS = 14;

export interface FlaggedEntry {
  uuid: string;
  gameId: string;
  gameName: string;
  candidate: RejectedCandidate;
  rejectReason: string;
  detectedAt: Date;
  expiresAt: Date;
}

async function flaggedCol() {
  const db = await getDb();
  const c = db.collection<FlaggedEntry>("flagged_seasons");
  await Promise.all([
    c.createIndex({ uuid: 1 }, { unique: true, background: true }),
    c.createIndex({ gameId: 1 }, { background: true }),
    c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true }),
  ]);
  return c;
}

export async function saveFlaggedSeason(entry: FlaggedEntry): Promise<void> {
  const c = await flaggedCol();
  await c.insertOne(entry);
}

export async function getAllFlagged(): Promise<FlaggedEntry[]> {
  const c = await flaggedCol();
  return c.find({}, { sort: { detectedAt: -1 } }).toArray();
}
