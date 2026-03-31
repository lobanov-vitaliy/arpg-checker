import fs from "fs/promises";
import path from "path";

const IS_VERCEL = Boolean(process.env.VERCEL);
const LOCAL_CACHE_DIR = path.join(process.cwd(), ".cache");
export const SEASON_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// ── Local file cache (dev) ────────────────────────────────────────────────────

async function getLocal<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await fs.readFile(
      path.join(LOCAL_CACHE_DIR, `${key}.json`),
      "utf-8"
    );
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (new Date(entry.expiresAt) > new Date()) return entry;
    await fs.unlink(path.join(LOCAL_CACHE_DIR, `${key}.json`)).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

async function setLocal<T>(key: string, data: T, ttlMs: number) {
  await fs.mkdir(LOCAL_CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  await fs.writeFile(
    path.join(LOCAL_CACHE_DIR, `${key}.json`),
    JSON.stringify(entry, null, 2),
    "utf-8"
  );
}

// ── Vercel Blob cache (production) ────────────────────────────────────────────

const BLOB_PREFIX = "arpg-cache";

async function getBlob<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/${key}.json` });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const entry = (await res.json()) as CacheEntry<T>;
    if (new Date(entry.expiresAt) > new Date()) return entry;
    return null;
  } catch {
    return null;
  }
}

async function setBlob<T>(key: string, data: T, ttlMs: number) {
  const { put } = await import("@vercel/blob");
  const entry: CacheEntry<T> = {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  // addRandomSuffix: false → deterministic path = overwrite on each put
  await put(`${BLOB_PREFIX}/${key}.json`, JSON.stringify(entry), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = IS_VERCEL ? await getBlob<T>(key) : await getLocal<T>(key);
  return entry?.data ?? null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS
): Promise<void> {
  if (IS_VERCEL) {
    await setBlob(key, data, ttlMs);
  } else {
    await setLocal(key, data, ttlMs);
  }
}

export async function getCachedWithMeta<T>(
  key: string
): Promise<{ data: T; cachedAt: string; expiresAt: string } | null> {
  return IS_VERCEL ? getBlob<T>(key) : getLocal<T>(key);
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
