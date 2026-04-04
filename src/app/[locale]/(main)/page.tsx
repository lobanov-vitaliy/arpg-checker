import { getTranslations } from "next-intl/server";
import { getGames } from "@/config/games";
import { GameGrid } from "@/components/dashboard/GameGrid";
import { GameCard } from "@/components/dashboard/GameCard";
import { getAllSeasons, getAllSeasonsPerGame } from "@/lib/seasons";
import { getAllLikesCounts } from "@/lib/likes";
import { getAllSteamData } from "@/lib/steam-fetcher";

const INITIAL_BATCH = 8;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t0 = performance.now();
  const [tHero, sp, games] = await Promise.all([
    getTranslations("hero"),
    searchParams,
    getGames(),
  ]);

  const initialGames = games.slice(0, INITIAL_BATCH);

  const [seasons, seasonsPerGameMap, likesMap, steamMap] = await Promise.all([
    getAllSeasons(),
    getAllSeasonsPerGame(),
    getAllLikesCounts(),
    getAllSteamData(),
  ]);
  console.log(`[dashboard] ${(performance.now() - t0).toFixed(0)}ms | games:${games.length} initial:${initialGames.length}`);

  const initialParams = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? "")]),
  );

  const cards = await Promise.all(
    initialGames.map(async (game) => ({
      gameId: game.id,
      node: (
        <GameCard
          key={game.id}
          game={game}
          prefetchedSeasons={seasonsPerGameMap[game.id] ?? []}
          prefetchedLikes={likesMap[game.id] ?? 0}
          prefetchedSteam={steamMap[game.id] ?? null}
        />
      ),
    })),
  );

  return (
    <main className="container mx-auto p-4">
      <section className="relative px-6 py-6 sm:px-10 sm:py-8">
        <div className="text-center flex flex-col items-center">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {tHero("tagline")}
          </p>
          <h1 className="font-black leading-[0.85] tracking-tighter">
            <span className="block text-[clamp(3rem,8vw,6.5rem)] text-white">
              {tHero("line1")}
            </span>
            <span className="block text-[clamp(3rem,8vw,6.5rem)] text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
              {tHero("line2")}
            </span>
          </h1>
          <p className="mt-6 text-sm sm:text-base text-gray-400 max-w-lg">
            {tHero("sub", { count: "20+" })}
          </p>
        </div>
      </section>

      <GameGrid
        games={games}
        seasons={seasons}
        cards={cards}
        initialParams={initialParams}
      />
    </main>
  );
}
