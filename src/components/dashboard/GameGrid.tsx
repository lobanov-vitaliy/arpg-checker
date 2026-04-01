"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
} from "lucide-react";
import { getFavorites } from "./FavoriteButton";
import type { GameConfig, SeasonData } from "@/types";
import type { ReactNode } from "react";

type CardSortKey = "popularity" | "recentStart" | "nextSeason";
type TableSortKey =
  | "name"
  | "status"
  | "started"
  | "ends"
  | "next"
  | "popularity";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

const STATUS_ORDER = { active: 0, upcoming: 1, unknown: 2, ended: 3 };
const TABLE_SORT_DEFAULTS: Record<TableSortKey, SortDir> = {
  name: "asc",
  status: "asc",
  started: "desc",
  ends: "asc",
  next: "asc",
  popularity: "desc",
};

interface GameGridProps {
  games: GameConfig[];
  seasons: SeasonData[];
  cards: { gameId: string; node: ReactNode }[];
  tableRows: { gameId: string; node: ReactNode }[];
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
        const ta = sa?.nextSeasonStartDate
          ? new Date(sa.nextSeasonStartDate).getTime()
          : null;
        const tb = sb?.nextSeasonStartDate
          ? new Date(sb.nextSeasonStartDate).getTime()
          : null;
        const fa = ta && ta > now ? ta : Infinity;
        const fb = tb && tb > now ? tb : Infinity;
        // Official dates first, then estimated, then no date
        const oa =
          fa !== Infinity && sa?.nextSeasonIsEstimated === false
            ? 0
            : fa !== Infinity
              ? 1
              : 2;
        const ob =
          fb !== Infinity && sb?.nextSeasonIsEstimated === false
            ? 0
            : fb !== Infinity
              ? 1
              : 2;
        if (oa !== ob) return oa - ob;
        return fa - fb;
      }
      return 0;
    })
    .map((g) => g.id);
}

function getTableSortedIds(
  games: GameConfig[],
  seasons: SeasonData[],
  key: TableSortKey,
  dir: SortDir,
): string[] {
  const sm = Object.fromEntries(seasons.map((s) => [s.gameId, s]));
  const now = Date.now();

  return [...games]
    .sort((a, b) => {
      const sa = sm[a.id];
      const sb = sm[b.id];
      let cmp = 0;

      switch (key) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "status":
          cmp =
            (STATUS_ORDER[sa?.status ?? "unknown"] ?? 2) -
            (STATUS_ORDER[sb?.status ?? "unknown"] ?? 2);
          break;
        case "started":
          cmp =
            (sa?.startDate ? new Date(sa.startDate).getTime() : 0) -
            (sb?.startDate ? new Date(sb.startDate).getTime() : 0);
          break;
        case "ends":
          cmp =
            (sa?.endDate ? new Date(sa.endDate).getTime() : Infinity) -
            (sb?.endDate ? new Date(sb.endDate).getTime() : Infinity);
          break;
        case "next": {
          const na = sa?.nextSeasonStartDate
            ? new Date(sa.nextSeasonStartDate).getTime()
            : null;
          const nb = sb?.nextSeasonStartDate
            ? new Date(sb.nextSeasonStartDate).getTime()
            : null;
          const fa = na && na > now ? na : Infinity;
          const fb = nb && nb > now ? nb : Infinity;
          const oa =
            fa !== Infinity && sa?.nextSeasonIsEstimated === false
              ? 0
              : fa !== Infinity
                ? 1
                : 2;
          const ob =
            fb !== Infinity && sb?.nextSeasonIsEstimated === false
              ? 0
              : fb !== Infinity
                ? 1
                : 2;
          cmp = oa !== ob ? oa - ob : fa - fb;
          break;
        }
        case "popularity":
          cmp = a.popularityScore - b.popularityScore;
          break;
      }

      return dir === "asc" ? cmp : -cmp;
    })
    .map((g) => g.id);
}

// ── Component ─────────────────────────────────────────────────────────────────

function GameGridInner({
  games,
  seasons,
  cards,
  tableRows,
  initialParams = {},
}: GameGridProps) {
  const t = useTranslations("sort");
  const tFilter = useTranslations("filter");
  const tTable = useTranslations("table");

  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = useState<ViewMode>(
    (initialParams.view as ViewMode) ?? "grid",
  );
  const [cardSort, setCardSort] = useState<CardSortKey>(
    (initialParams.sort as CardSortKey) ?? "nextSeason",
  );
  const [tableSort, setTableSort] = useState<TableSortKey>(
    (initialParams.tsort as TableSortKey) ?? "started",
  );
  const [tableSortDir, setTableSortDir] = useState<SortDir>(
    (initialParams.tdir as SortDir) ?? "desc",
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(
    initialParams.genre ?? "",
  );
  const [genreOpen, setGenreOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState<string>(initialParams.q ?? "");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavoritesState] = useState<string[]>([]);

  useEffect(() => {
    setFavoritesState(getFavorites());
    const handler = () => setFavoritesState(getFavorites());
    window.addEventListener("sp_favoritechange", handler);
    return () => window.removeEventListener("sp_favoritechange", handler);
  }, []);

  const allGenres = [...new Set(games.flatMap((g) => g.genres))].sort();
  const cardMap = Object.fromEntries(cards.map((c) => [c.gameId, c.node]));
  const rowMap = Object.fromEntries(tableRows.map((r) => [r.gameId, r.node]));

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

  const handleView = (v: ViewMode) => {
    setView(v);
    pushUrl({ view: v });
  };
  const handleCardSort = (k: CardSortKey) => {
    setCardSort(k);
    pushUrl({ sort: k });
  };
  const handleGenre = (g: string) => {
    setSelectedGenre(g);
    setGenreOpen(false);
    pushUrl({ genre: g });
  };
  const handleQuery = (q: string) => {
    setQuery(q);
    pushUrl({ q });
  };

  const handleTableSort = (col: TableSortKey) => {
    if (col === tableSort) {
      const newDir: SortDir = tableSortDir === "asc" ? "desc" : "asc";
      setTableSortDir(newDir);
      pushUrl({ tsort: col, tdir: newDir });
    } else {
      const newDir = TABLE_SORT_DEFAULTS[col];
      setTableSort(col);
      setTableSortDir(newDir);
      pushUrl({ tsort: col, tdir: newDir });
    }
  };

  const baseIds =
    view === "grid"
      ? getCardSortedIds(games, seasons, cardSort)
      : getTableSortedIds(games, seasons, tableSort, tableSortDir);

  const filteredIds = baseIds.filter((id) => {
    const game = games.find((g) => g.id === id);
    if (!game) return false;
    if (favoritesOnly && !favorites.includes(id)) return false;
    if (selectedGenre && !game.genres.includes(selectedGenre)) return false;
    if (query && !game.name.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  const cardSortOptions: { key: CardSortKey; label: string }[] = [
    { key: "popularity", label: t("popularity") },
    { key: "recentStart", label: t("recentStart") },
    { key: "nextSeason", label: t("nextSeason") },
  ];

  function ColHeader({ col, label }: { col: TableSortKey; label: string }) {
    const active = tableSort === col;
    return (
      <th
        className="py-2.5 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap cursor-pointer select-none hover:text-gray-300 transition-colors"
        onClick={() => handleTableSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (
            tableSortDir === "asc" ? (
              <ArrowUp className="w-3 h-3 text-gray-300" />
            ) : (
              <ArrowDown className="w-3 h-3 text-gray-300" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div>
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Left: Search + Genre filter + Favorites */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* All / Favorites toggle */}
          <div className="flex items-center rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
            <button
              onClick={() => setFavoritesOnly(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${!favoritesOnly ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              {tFilter("all")}
            </button>
            <button
              onClick={() => setFavoritesOnly(true)}
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
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder={tFilter("search")}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-gray-700 bg-gray-900 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors w-56"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      {filteredIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Search className="w-8 h-8 mb-3 opacity-40" />
          <p className="text-sm">{tFilter("noResults")}</p>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filteredIds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIds.map((id) => cardMap[id])}
        </div>
      )}

      {/* Table view */}
      {view === "table" && filteredIds.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <ColHeader col="name" label={tTable("game")} />
                <th className="py-2.5 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
                  {tTable("genres")}
                </th>
                <th className="py-2.5 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
                  {tTable("season")}
                </th>
                <ColHeader col="started" label={tTable("started")} />
                <ColHeader col="ends" label={tTable("ends")} />
                <ColHeader col="next" label={tTable("nextSeason")} />
                <th className="py-2.5 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
                  {tTable("players")}
                </th>
                <ColHeader col="popularity" label={tTable("popularity")} />
                <th className="py-2.5 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium" />
              </tr>
            </thead>
            <tbody className="bg-gray-950/50">
              {filteredIds.map((id) => rowMap[id])}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { GameGridInner as GameGrid };
