import { NextResponse } from "next/server";
import { GAMES } from "@/config/games";
import { fetchNewsFromAI } from "@/lib/ai-fetcher";
import { getCached, setCached, CACHE_KEYS } from "@/lib/cache";
import type { NewsArticle } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const cacheKey = CACHE_KEYS.news();

  const cached = await getCached<NewsArticle[]>(cacheKey);
  if (cached) {
    return NextResponse.json({
      articles: cached,
      cachedAt: now.toISOString(),
      nextRefresh: new Date(now.getTime() + 3_600_000).toISOString(),
    });
  }

  try {
    const gameNames = GAMES.map((g) => g.name);
    const articles = await fetchNewsFromAI(gameNames);
    await setCached(cacheKey, articles);
    return NextResponse.json({
      articles,
      cachedAt: now.toISOString(),
      nextRefresh: new Date(now.getTime() + 3_600_000).toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        articles: [],
        error: err instanceof Error ? err.message : "Fetch failed",
        cachedAt: now.toISOString(),
        nextRefresh: now.toISOString(),
      },
      { status: 500 }
    );
  }
}
