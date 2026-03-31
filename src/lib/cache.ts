import fs from "fs/promises";
import path from "path";

// On Vercel only /tmp is writable; locally use .cache/ in the project root
const CACHE_DIR = process.env.VERCEL
  ? "/tmp/arpg-cache"
  : path.join(process.cwd(), ".cache");
const SEASON_TTL_MS = 60 * 60 * 1000;  // 1 hour

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (new Date(entry.expiresAt) > new Date()) {
      return entry.data;
    }
    await fs.unlink(filePath).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS
): Promise<void> {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry<T> = {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
}

export async function getCachedWithMeta<T>(
  key: string
): Promise<{ data: T; cachedAt: string; expiresAt: string } | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (new Date(entry.expiresAt) > new Date()) {
      return entry;
    }
    await fs.unlink(filePath).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
