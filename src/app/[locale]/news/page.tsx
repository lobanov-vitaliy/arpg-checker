import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NewsGrid } from "@/components/news/NewsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { getCached, setCached, CACHE_KEYS } from "@/lib/cache";
import { fetchNewsFromAI } from "@/lib/ai-fetcher";
import { GAMES } from "@/config/games";
import type { NewsArticle } from "@/types";

export const dynamic = "force-dynamic";

async function getNews(): Promise<NewsArticle[]> {
  const cached = await getCached<NewsArticle[]>(CACHE_KEYS.news());
  if (cached) return cached;
  const gameNames = GAMES.map((g) => g.name);
  const articles = await fetchNewsFromAI(gameNames);
  await setCached(CACHE_KEYS.news(), articles);
  return articles;
}

async function NewsFeed() {
  const articles = await getNews();
  return <NewsGrid articles={articles} />;
}

function NewsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="border border-gray-700/50 bg-gray-900/60 rounded-lg p-4 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export default async function NewsPage() {
  const t = await getTranslations("news");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400 text-sm">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<NewsLoadingSkeleton />}>
        <NewsFeed />
      </Suspense>
    </main>
  );
}
