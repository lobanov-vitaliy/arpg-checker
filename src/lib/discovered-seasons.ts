import { getDb } from "./mongodb";
import { addSeason } from "./games-db";
import type { ManualSeasonEntry } from "@/types";

export interface PendingEntry {
  uuid: string;
  gameId: string;
  gameName: string;
  season: ManualSeasonEntry;
  detectedAt: string;
}

async function pendingCol() {
  const db = await getDb();
  const c = db.collection<PendingEntry>("pending_seasons");
  await c.createIndex({ uuid: 1 }, { unique: true, background: true });
  await c.createIndex({ gameId: 1 }, { background: true });
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
