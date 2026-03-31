import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { GAMES } from "@/config/games";
import { GameGrid } from "@/components/dashboard/GameGrid";
import { GameCardSkeleton } from "@/components/dashboard/GameCardSkeleton";
import { getCached, setCached, CACHE_KEYS } from "@/lib/cache";
import { fetchSeasonFromAI } from "@/lib/ai-fetcher";
import type { SeasonData } from "@/types";

export const dynamic = "force-dynamic";

async function getAllSeasons(): Promise<SeasonData[]> {
  const results = await Promise.allSettled(
    GAMES.map(async (game): Promise<SeasonData> => {
      const cached = await getCached<SeasonData>(CACHE_KEYS.season(game.id));
      if (cached) return cached;
      const data = await fetchSeasonFromAI(game);
      await setCached(CACHE_KEYS.season(game.id), data);
      return data;
    })
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      gameId: GAMES[i].id,
      seasonName: "Data unavailable",
      status: "unknown" as const,
      startDate: null,
      endDate: null,
      confidence: "low" as const,
      fetchedAt: new Date().toISOString(),
      error:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    };
  });
}

async function SeasonsGrid() {
  const seasons = await getAllSeasons();
  return <GameGrid games={GAMES} seasons={seasons} />;
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400 text-sm">{t("subtitle")}</p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES.map((g) => <GameCardSkeleton key={g.id} />)}
          </div>
        }
      >
        <SeasonsGrid />
      </Suspense>
    </main>
  );
}
