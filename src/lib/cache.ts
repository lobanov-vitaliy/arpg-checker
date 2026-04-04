import type { Collection } from "mongodb";
import { getDb } from "./mongodb";

export const SEASON_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheDoc<T> {
  key: string;
  data: T;
  cachedAt: Date;
  expiresAt: Date;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

let _colPromise: Promise<Collection<CacheDoc<unknown>>> | undefined;

async function col() {
  if (!_colPromise) {
    _colPromise = (async () => {
      const db = await getDb();
      const c = db.collection<CacheDoc<unknown>>("cache");
      await Promise.all([
        c.createIndex({ key: 1 }, { unique: true }),
        c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
      return c;
    })();
  }
  return _colPromise;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const c = await col();
  const doc = await c.findOne({ key });
  return (doc?.data as T) ?? null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS
): Promise<void> {
  const c = await col();
  await c.updateOne(
    { key },
    {
      $set: {
        key,
        data,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    },
    { upsert: true }
  );
}

export async function getCachedWithMeta<T>(
  key: string
): Promise<CacheEntry<T> | null> {
  const c = await col();
  const doc = await c.findOne({ key });
  if (!doc) return null;
  return {
    data: doc.data as T,
    cachedAt: doc.cachedAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
  };
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
