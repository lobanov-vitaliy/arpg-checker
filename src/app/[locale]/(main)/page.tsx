import { getTranslations } from "next-intl/server";
import { getGames } from "@/config/games";
import { GameGrid } from "@/components/dashboard/GameGrid";
import { GameCard } from "@/components/dashboard/GameCard";
import { getAllSeasons, getAllSeasonsPerGame } from "@/lib/seasons";
import { getAllLikesCounts } from "@/lib/likes";
import { getAllSteamData } from "@/lib/steam-fetcher";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const INITIAL_BATCH = 8;

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const t0 = performance.now();
  const [tHero, sp, { locale }, games] = await Promise.all([
    getTranslations("hero"),
    searchParams,
    params,
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

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === "ua" ? "uk" : locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: ["https://twitter.com/seasonpulse"],
  };

  return (
    <main className="container mx-auto p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
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
