import fs from "fs/promises";
import path from "path";

const IS_VERCEL = process.env.VERCEL === "1";
const CACHE_DRIVER = process.env.CACHE_DRIVER ?? (IS_VERCEL ? "blob" : "local");
const USE_BLOB_CACHE = CACHE_DRIVER === "blob";
const LOCAL_CACHE_DIR = IS_VERCEL
  ? path.join("/tmp", ".cache")
  : path.join(process.cwd(), ".cache");

export const SEASON_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function createEntry<T>(data: T, ttlMs: number): CacheEntry<T> {
  return {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
}

// ── Local file cache ──────────────────────────────────────────────────────────

async function getLocal<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const filePath = path.join(LOCAL_CACHE_DIR, `${key}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;

    if (!isExpired(entry.expiresAt)) {
      return entry;
    }

    await fs.unlink(filePath).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

async function setLocal<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const filePath = path.join(LOCAL_CACHE_DIR, `${key}.json`);
  const entry = createEntry(data, ttlMs);

  await fs.mkdir(LOCAL_CACHE_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
}

// ── Vercel Blob cache ─────────────────────────────────────────────────────────

const BLOB_PREFIX = "arpg-cache";

async function getBlob<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/${key}.json` });

    if (!blobs.length) return null;

    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;

    const entry = (await res.json()) as CacheEntry<T>;

    if (!isExpired(entry.expiresAt)) {
      return entry;
    }

    return null;
  } catch (error) {
    console.error(`[cache:getBlob] Failed for key "${key}"`, error);
    return null;
  }
}

async function setBlob<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const { put } = await import("@vercel/blob");
  const entry = createEntry(data, ttlMs);

  await put(`${BLOB_PREFIX}/${key}.json`, JSON.stringify(entry), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  if (USE_BLOB_CACHE) {
    const blobEntry = await getBlob<T>(key);
    if (blobEntry) return blobEntry.data;

    if (IS_VERCEL) {
      const localEntry = await getLocal<T>(key);
      return localEntry?.data ?? null;
    }

    return null;
  }

  const localEntry = await getLocal<T>(key);
  return localEntry?.data ?? null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS,
): Promise<void> {
  if (USE_BLOB_CACHE) {
    try {
      await setBlob(key, data, ttlMs);
      return;
    } catch (error) {
      console.error(
        `[cache:setBlob] Failed for key "${key}", fallback to local`,
        error,
      );

      // fallback only to /tmp on Vercel, or cwd locally
      await setLocal(key, data, ttlMs);
      return;
    }
  }

  await setLocal(key, data, ttlMs);
}

export async function getCachedWithMeta<T>(
  key: string,
): Promise<CacheEntry<T> | null> {
  if (USE_BLOB_CACHE) {
    const blobEntry = await getBlob<T>(key);
    if (blobEntry) return blobEntry;

    if (IS_VERCEL) {
      return getLocal<T>(key);
    }

    return null;
  }

  return getLocal<T>(key);
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
