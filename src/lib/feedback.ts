import crypto from "crypto";
import { getDb } from "./mongodb";

const SALT = process.env.LIKES_SALT ?? "seasonpulse-likes";
const MAX_PER_DAY = 5;
const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export type FeedbackType = "idea" | "game";

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  text: string;
  ipHash: string;
  createdAt: string;
  readAt?: string;
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
  const c = db.collection<FeedbackEntry>("feedback");
  await c.createIndex({ ipHash: 1, createdAt: 1 }, { background: true });
  return c;
}

export async function addFeedback(
  type: FeedbackType,
  text: string,
  ip: string
): Promise<{ ok: boolean; error?: "rate_limit" | "invalid" }> {
  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return { ok: false, error: "invalid" };
  }

  const hash = hashIp(ip);
  const c = await col();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await c.countDocuments({
    ipHash: hash,
    createdAt: { $gt: dayAgo.toISOString() },
  });
  if (recentCount >= MAX_PER_DAY) {
    return { ok: false, error: "rate_limit" };
  }

  const entry: FeedbackEntry = {
    id: crypto.randomUUID(),
    type,
    text: trimmed,
    ipHash: hash,
    createdAt: new Date().toISOString(),
  };

  await c.insertOne(entry);
  return { ok: true };
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  const c = await col();
  return c.find({}, { sort: { createdAt: -1 } }).toArray();
}

export async function markFeedbackRead(id: string): Promise<void> {
  const c = await col();
  await c.updateOne({ id }, { $set: { readAt: new Date().toISOString() } });
}

export async function deleteFeedback(id: string): Promise<void> {
  const c = await col();
  await c.deleteOne({ id });
}
