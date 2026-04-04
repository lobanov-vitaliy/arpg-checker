import crypto from "crypto";
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

async function col() {
  const db = await getDb();
  const c = db.collection<LikesDoc>("likes");
  await c.createIndex({ gameId: 1 }, { unique: true, background: true });
  return c;
}

export async function getLikesCount(gameId: string): Promise<number> {
  const c = await col();
  const doc = await c.findOne({ gameId });
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
