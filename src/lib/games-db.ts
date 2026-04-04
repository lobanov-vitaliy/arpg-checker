import { getDb } from "./mongodb";
import type { GameConfig, ManualSeasonEntry } from "@/types";

export interface GameDoc extends GameConfig {
  seasons: ManualSeasonEntry[];
}

import type { Collection } from "mongodb";

let _colPromise: Promise<Collection<GameDoc>> | undefined;

async function getCol(): Promise<Collection<GameDoc>> {
  if (!_colPromise) {
    _colPromise = (async () => {
      const db = await getDb();
      const c = db.collection<GameDoc>("games");
      await Promise.all([
        c.createIndex({ id: 1 }, { unique: true }),
        c.createIndex({ genres: 1 }),
        c.createIndex({ name: "text" }),
      ]);
      const count = await c.countDocuments();
      if (count === 0) {
        const { GAMES, GAME_SEASONS } = await import("@/data");
        const docs: GameDoc[] = GAMES.map((game) => {
          const gs = GAME_SEASONS.find((g) => g.gameId === game.id);
          return { ...game, seasons: gs?.seasons ?? [] };
        });
        if (docs.length > 0) await c.insertMany(docs);
      }
      return c;
    })();
  }
  return _colPromise;
}

export async function getGames(): Promise<GameConfig[]> {
  const t = performance.now();
  const c = await getCol();
  const docs = await c.find({}, { projection: { seasons: 0, _id: 0 } }).toArray();
  console.log(`[db] getGames: ${(performance.now() - t).toFixed(0)}ms (${docs.length} games)`);
  return docs as unknown as GameConfig[];
}

export async function getGame(id: string): Promise<GameConfig | null> {
  const c = await getCol();
  const doc = await c.findOne({ id }, { projection: { seasons: 0, _id: 0 } });
  return doc as unknown as GameConfig | null;
}

export async function getGameSeasons(gameId: string): Promise<ManualSeasonEntry[]> {
  const c = await getCol();
  const doc = await c.findOne({ id: gameId }, { projection: { seasons: 1, _id: 0 } });
  return doc?.seasons ?? [];
}

export async function getAllGameSeasons(): Promise<{ gameId: string; seasons: ManualSeasonEntry[] }[]> {
  const t = performance.now();
  const c = await getCol();
  const docs = await c.find({}, { projection: { id: 1, seasons: 1, _id: 0 } }).toArray();
  console.log(`[db] getAllGameSeasons: ${(performance.now() - t).toFixed(0)}ms`);
  return docs.map((d) => ({ gameId: d.id, seasons: d.seasons ?? [] }));
}

export async function getAllGameSeasonsForIds(gameIds: string[]): Promise<{ gameId: string; seasons: ManualSeasonEntry[] }[]> {
  const c = await getCol();
  const docs = await c.find({ id: { $in: gameIds } }, { projection: { id: 1, seasons: 1, _id: 0 } }).toArray();
  return docs.map((d) => ({ gameId: d.id, seasons: d.seasons ?? [] }));
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createGame(data: GameDoc): Promise<void> {
  const c = await getCol();
  await c.insertOne({ ...data });
}

export async function updateGame(
  id: string,
  data: Partial<Omit<GameDoc, "id" | "seasons">>
): Promise<void> {
  const c = await getCol();
  await c.updateOne({ id }, { $set: data });
}

export async function deleteGame(id: string): Promise<void> {
  const c = await getCol();
  await c.deleteOne({ id });
}

// ── Season CRUD ───────────────────────────────────────────────────────────────

export async function addSeason(gameId: string, entry: ManualSeasonEntry): Promise<void> {
  const c = await getCol();
  const existing = await c.findOne({ id: gameId }, { projection: { "seasons.startDate": 1 } });
  if (existing?.seasons?.some((s) => s.startDate === entry.startDate)) return;
  await c.updateOne(
    { id: gameId },
    { $push: { seasons: { $each: [entry], $position: 0 } } }
  );
}

export async function updateSeason(
  gameId: string,
  startDate: string,
  data: Partial<ManualSeasonEntry>
): Promise<void> {
  const c = await getCol();
  const setObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    setObj[`seasons.$.${k}`] = v;
  }
  await c.updateOne({ id: gameId, "seasons.startDate": startDate }, { $set: setObj });
}

export async function deleteSeason(gameId: string, startDate: string): Promise<void> {
  const c = await getCol();
  await c.updateOne({ id: gameId }, { $pull: { seasons: { startDate } } });
}
