import { NextResponse } from "next/server";
import { getCached, CACHE_KEYS } from "@/lib/cache";
import type { NewsArticle } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const articles = (await getCached<NewsArticle[]>(CACHE_KEYS.news())) ?? [];

  return NextResponse.json({
    articles,
    cachedAt: now.toISOString(),
    nextRefresh: new Date(now.getTime() + 3_600_000).toISOString(),
  });
}
