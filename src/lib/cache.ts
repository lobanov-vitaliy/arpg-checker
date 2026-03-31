import { list, put } from "@vercel/blob";

const BLOB_PREFIX = "arpg-cache";
export const SEASON_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

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

async function getBlob<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const pathname = `${BLOB_PREFIX}/${key}.json`;

    const { blobs } = await list({ prefix: pathname });

    const blob = blobs.find((item) => item.pathname === pathname);
    if (!blob) return null;

    const res = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[cache:getBlob] Failed to fetch "${key}": ${res.status}`);
      return null;
    }

    const entry = (await res.json()) as CacheEntry<T>;

    if (isExpired(entry.expiresAt)) {
      return null;
    }

    return entry;
  } catch (error) {
    console.error(`[cache:getBlob] Failed for key "${key}"`, error);
    return null;
  }
}

async function setBlob<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const pathname = `${BLOB_PREFIX}/${key}.json`;
  const entry = createEntry(data, ttlMs);

  await put(pathname, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = await getBlob<T>(key);
  return entry?.data ?? null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlMs = SEASON_TTL_MS,
): Promise<void> {
  await setBlob(key, data, ttlMs);
}

export async function getCachedWithMeta<T>(
  key: string,
): Promise<CacheEntry<T> | null> {
  return getBlob<T>(key);
}

export const CACHE_KEYS = {
  season: (gameId: string) => `season_${gameId}`,
  news: () => "news_latest",
};
