"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { ChevronDown, Search, Star } from "lucide-react";
import { getFavorites } from "./FavoriteButton";
import { GameCardClient } from "./GameCardClient";
import type { GameConfig, SeasonData, GameFullData } from "@/types";
import type { ReactNode } from "react";

const INITIAL_VISIBLE = 12;
const LOAD_BATCH = 8;

type CardSortKey = "popularity" | "recentStart" | "nextSeason";

interface GameGridProps {
  games: GameConfig[];
  seasons: SeasonData[];
  cards: { gameId: string; node: ReactNode }[];
  initialParams?: Record<string, string>;
}

function getCardSortedIds(
  games: GameConfig[],
  seasons: SeasonData[],
  key: CardSortKey,
): string[] {
  const sm = Object.fromEntries(seasons.map((s) => [s.gameId, s]));
  return [...games]
    .sort((a, b) => {
      const sa = sm[a.id];
      const sb = sm[b.id];
      if (key === "popularity") return b.popularityScore - a.popularityScore;
      if (key === "recentStart") {
        const da = sa?.startDate ? new Date(sa.startDate).getTime() : 0;
        const db = sb?.startDate ? new Date(sb.startDate).getTime() : 0;
        return db - da;
      }
      if (key === "nextSeason") {
        const now = Date.now();
        const ta = sa?.nextSeasonStartDate ? new Date(sa.nextSeasonStartDate).getTime() : null;
        const tb = sb?.nextSeasonStartDate ? new Date(sb.nextSeasonStartDate).getTime() : null;
        const fa = ta && ta > now ? ta : Infinity;
        const fb = tb && tb > now ? tb : Infinity;
        const oa = fa !== Infinity && sa?.nextSeasonIsEstimated === false ? 0 : fa !== Infinity ? 1 : 2;
        const ob = fb !== Infinity && sb?.nextSeasonIsEstimated === false ? 0 : fb !== Infinity ? 1 : 2;
        if (oa !== ob) return oa - ob;
        return fa - fb;
      }
      return 0;
    })
    .map((g) => g.id);
}

function GameCardSkeleton() {
  return (
    <div className="overflow-hidden bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-xl flex flex-col animate-pulse">
      <div className="h-36 bg-gray-800" />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-800 rounded" />
          <div className="h-5 w-32 bg-gray-800 rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-gray-800 rounded" />
          <div className="h-3 w-3/4 bg-gray-800 rounded" />
        </div>
        <div className="h-24 bg-gray-800/50 rounded-md" />
      </div>
    </div>
  );
}

function GameGridInner({ games, seasons, cards, initialParams = {} }: GameGridProps) {
  const t = useTranslations("sort");
  const tFilter = useTranslations("filter");
  const router = useRouter();
  const pathname = usePathname();

  const [cardSort, setCardSort] = useState<CardSortKey>(
    (initialParams.sort as CardSortKey) ?? "nextSeason",
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(initialParams.genre ?? "");
  const [genreOpen, setGenreOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState<string>(initialParams.q ?? "");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavoritesState] = useState<string[]>([]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [loadedDataMap, setLoadedDataMap] = useState<Record<string, GameFullData>>({});
  const fetchingRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavoritesState(getFavorites());
    const handler = () => setFavoritesState(getFavorites());
    window.addEventListener("sp_favoritechange", handler);
    return () => window.removeEventListener("sp_favoritechange", handler);
  }, []);

  const allGenres = useMemo(
    () => [...new Set(games.flatMap((g) => g.genres))].sort(),
    [games],
  );
  const cardMap = useMemo(
    () => Object.fromEntries(cards.map((c) => [c.gameId, c.node])),
    [cards],
  );
  const gameById = useMemo(
    () => Object.fromEntries(games.map((g) => [g.id, g])),
    [games],
  );

  const pushUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([k, v]) =>
        v ? params.set(k, v) : params.delete(k),
      );
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const handleCardSort = (k: CardSortKey) => {
    setCardSort(k);
    setSortOpen(false);
    track("filter_sort", { sort: k });
    pushUrl({ sort: k });
  };
  const handleGenre = (g: string) => {
    setSelectedGenre(g);
    setGenreOpen(false);
    if (g) track("filter_genre", { genre: g });
    pushUrl({ genre: g });
  };
  const handleQuery = (q: string) => {
    setQuery(q);
    if (q.length > 2) track("filter_search");
    pushUrl({ q });
  };

  const filteredIds = useMemo(() => {
    const sorted = getCardSortedIds(games, seasons, cardSort);
    return sorted.filter((id) => {
      const game = gameById[id];
      if (!game) return false;
      if (favoritesOnly && !favorites.includes(id)) return false;
      if (selectedGenre && !game.genres.includes(selectedGenre)) return false;
      if (query && !game.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [games, seasons, cardSort, gameById, favoritesOnly, favorites, selectedGenre, query]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [query, selectedGenre, favoritesOnly, cardSort]);

  const visibleIds = filteredIds.slice(0, visibleCount);

  useEffect(() => {
    const missing = visibleIds.filter(
      (id) => !cardMap[id] && !loadedDataMap[id] && !fetchingRef.current.has(id),
    );
    if (!missing.length) return;
    missing.forEach((id) => fetchingRef.current.add(id));
    fetch(`/api/dashboard/games?ids=${missing.join(",")}`)
      .then((r) => r.json())
      .then((data: Record<string, GameFullData>) => {
        setLoadedDataMap((prev) => ({ ...prev, ...data }));
        missing.forEach((id) => fetchingRef.current.delete(id));
      })
      .catch(() => {
        missing.forEach((id) => fetchingRef.current.delete(id));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join(",")]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filteredIds.length) {
          setVisibleCount((prev) => Math.min(prev + LOAD_BATCH, filteredIds.length));
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredIds.length]);

  const cardSortOptions: { key: CardSortKey; label: string }[] = [
    { key: "nextSeason", label: t("nextSeason") },
    { key: "popularity", label: t("popularity") },
    { key: "recentStart", label: t("recentStart") },
  ];

  function renderCard(id: string) {
    if (cardMap[id]) return <div key={id}>{cardMap[id]}</div>;
    const data = loadedDataMap[id];
    const game = gameById[id];
    if (data && game) {
      return <GameCardClient key={id} game={game} seasons={data.seasons} likes={data.likes} steam={data.steam} />;
    }
    return <GameCardSkeleton key={id} />;
  }

  return (
    <div>
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Left: Favorites + Search + Genre */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-white/5 bg-gray-900/60 backdrop-blur-md overflow-hidden">
            <button
              onClick={() => setFavoritesOnly(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${!favoritesOnly ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tFilter("all")}
            </button>
            <button
              onClick={() => { setFavoritesOnly(true); track("filter_favorites", { enabled: true }); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${favoritesOnly ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Star
                className="w-3 h-3"
                style={{
                  fill: favoritesOnly ? "#facc15" : "transparent",
                  stroke: favoritesOnly ? "#facc15" : "currentColor",
                }}
              />
              {tFilter("favorites")}
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder={tFilter("search")}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-white/5 bg-gray-900/60 backdrop-blur-md text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors w-56"
              suppressHydrationWarning
            />
          </div>

          {allGenres.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setGenreOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/5 bg-gray-900/60 backdrop-blur-md text-gray-400 hover:text-gray-200 transition-colors"
              >
                {selectedGenre || tFilter("label")}
                <ChevronDown className={`w-3 h-3 transition-transform ${genreOpen ? "rotate-180" : ""}`} />
              </button>
              {genreOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 min-w-40 rounded-lg border border-gray-700 bg-gray-900 shadow-xl py-1">
                  <button
                    onClick={() => handleGenre("")}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!selectedGenre ? "text-white bg-gray-800" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"}`}
                  >
                    {tFilter("all")}
                  </button>
                  {allGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenre(g)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedGenre === g ? "text-white bg-gray-800" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Sort */}
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/5 bg-gray-900/60 backdrop-blur-md text-gray-400 hover:text-gray-200 transition-colors"
          >
            {cardSortOptions.find((o) => o.key === cardSort)?.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <div className="absolute top-full right-0 mt-1 z-20 min-w-40 rounded-lg border border-gray-700 bg-gray-900 shadow-xl py-1">
              {cardSortOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => handleCardSort(o.key)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${cardSort === o.key ? "text-white bg-gray-800" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Search className="w-8 h-8 mb-3 opacity-40" />
          <p className="text-sm">{tFilter("noResults")}</p>
        </div>
      )}

      {filteredIds.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleIds.map((id) => renderCard(id))}
          </div>
          <div ref={sentinelRef} className="h-4" />
          {visibleCount < filteredIds.length && (
            <p className="text-center text-xs text-gray-600 mt-2">
              {visibleCount} / {filteredIds.length}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export { GameGridInner as GameGrid };
