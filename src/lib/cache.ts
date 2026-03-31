import fs from "fs/promises";
import path from "path";

// Set CACHE_DRIVER=local in .env.local for dev
// Set CACHE_DRIVER=blob  in Vercel environment variables for prod
const CACHE_DRIVER = process.env.CACHE_DRIVER ?? "local";

const LOCAL_CACHE_DIR = path.join(process.cwd(), ".cache");
export const SEASON_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// ── Local file cache ──────────────────────────────────────────────────────────

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

// ── Vercel Blob cache ─────────────────────────────────────────────────────────

const BLOB_PREFIX = "arpg-cache";

async function getBlob<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const { list, del } = await import("@vercel/blob");
    const pathname = `${BLOB_PREFIX}/${key}.json`;
    const { blobs } = await list({ prefix: pathname });
    const blob = blobs.find((b) => b.pathname === pathname);
    if (!blob) return null;

    const res = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.trim().length < 2) return null; // empty blob

    let entry: CacheEntry<T>;
    try {
      entry = JSON.parse(text) as CacheEntry<T>;
    } catch {
      // Corrupted blob — delete it so next write starts fresh
      del(blob.url).catch(() => {});
      return null;
    }

    if (new Date(entry.expiresAt) <= new Date()) {
      // Expired — delete to keep storage clean, but still return stale data
      // so the page has something to show until the cron refreshes it
      del(blob.url).catch(() => {});
      return entry; // return stale rather than null
    }

    return entry;
  } catch (e) {
    console.error(`[cache:getBlob] ${key}`, e);
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
  await put(`${BLOB_PREFIX}/${key}.json`, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  const entry =
    CACHE_DRIVER === "blob"
      ? await getBlob<T>(key)
      : await getLocal<T>(key);
  return entry?.data ?? null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS
): Promise<void> {
  if (CACHE_DRIVER === "blob") {
    await setBlob(key, data, ttlMs);
  } else {
    await setLocal(key, data, ttlMs);
  }
}

export async function getCachedWithMeta<T>(
  key: string
): Promise<CacheEntry<T> | null> {
  return CACHE_DRIVER === "blob" ? getBlob<T>(key) : getLocal<T>(key);
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
