import crypto from "crypto";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";

const SALT = process.env.LIKES_SALT ?? "seasonpulse-likes";

interface LikesDoc {
  gameId: string;
  count: number;
  voters: string[];
}

function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + SALT)
    .digest("hex")
    .slice(0, 32);
}

let _colPromise: Promise<Collection<LikesDoc>> | undefined;

async function col() {
  if (!_colPromise) {
    _colPromise = (async () => {
      const db = await getDb();
      const c = db.collection<LikesDoc>("likes");
      await c.createIndex({ gameId: 1 }, { unique: true });
      return c;
    })();
  }
  return _colPromise;
}

export async function getAllLikesCounts(): Promise<Record<string, number>> {
  const t = performance.now();
  const c = await col();
  const docs = await c.find({}, { projection: { gameId: 1, count: 1, _id: 0 } }).toArray();
  console.log(`[db] getAllLikesCounts: ${(performance.now() - t).toFixed(0)}ms`);
  return Object.fromEntries(docs.map((d) => [d.gameId, d.count ?? 0]));
}

export async function getLikesCountsForIds(gameIds: string[]): Promise<Record<string, number>> {
  const c = await col();
  const docs = await c.find({ gameId: { $in: gameIds } }, { projection: { gameId: 1, count: 1, _id: 0 } }).toArray();
  return Object.fromEntries(docs.map((d) => [d.gameId, d.count ?? 0]));
}

export async function getLikesCount(gameId: string): Promise<number> {
  const c = await col();
  const doc = await c.findOne({ gameId }, { projection: { count: 1, _id: 0 } });
  return doc?.count ?? 0;
}

export async function toggleLike(
  gameId: string,
  ip: string
): Promise<{ count: number; liked: boolean }> {
  const hash = hashIp(ip);
  const c = await col();

  const doc = await c.findOne({ gameId });
  const alreadyLiked = doc?.voters.includes(hash) ?? false;

  if (alreadyLiked) {
    const result = await c.findOneAndUpdate(
      { gameId },
      { $inc: { count: -1 }, $pull: { voters: hash } },
      { returnDocument: "after", upsert: false }
    );
    return { count: result?.count ?? 0, liked: false };
  }

  const result = await c.findOneAndUpdate(
    { gameId },
    { $inc: { count: 1 }, $push: { voters: hash } },
    { returnDocument: "after", upsert: true }
  );
  return { count: result?.count ?? 1, liked: true };
}
