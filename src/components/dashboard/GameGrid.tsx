"use client";

import { useState, useCallback, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, List, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { GameConfig, SeasonData } from "@/types";
import type { ReactNode } from "react";

type CardSortKey = "popularity" | "recentStart" | "nextSeason";
type TableSortKey = "name" | "status" | "started" | "ends" | "next" | "popularity";
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
}

function getCardSortedIds(games: GameConfig[], seasons: SeasonData[], key: CardSortKey): string[] {
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
        // Official dates first, then estimated, then no date
        const oa = fa !== Infinity && sa?.nextSeasonIsEstimated === false ? 0 : fa !== Infinity ? 1 : 2;
        const ob = fb !== Infinity && sb?.nextSeasonIsEstimated === false ? 0 : fb !== Infinity ? 1 : 2;
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
  dir: SortDir
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
          cmp = (STATUS_ORDER[sa?.status ?? "unknown"] ?? 2) - (STATUS_ORDER[sb?.status ?? "unknown"] ?? 2);
          break;
        case "started":
          cmp = (sa?.startDate ? new Date(sa.startDate).getTime() : 0) -
                (sb?.startDate ? new Date(sb.startDate).getTime() : 0);
          break;
        case "ends":
          cmp = (sa?.endDate ? new Date(sa.endDate).getTime() : Infinity) -
                (sb?.endDate ? new Date(sb.endDate).getTime() : Infinity);
          break;
        case "next": {
          const na = sa?.nextSeasonStartDate ? new Date(sa.nextSeasonStartDate).getTime() : null;
          const nb = sb?.nextSeasonStartDate ? new Date(sb.nextSeasonStartDate).getTime() : null;
          const fa = na && na > now ? na : Infinity;
          const fb = nb && nb > now ? nb : Infinity;
          const oa = fa !== Infinity && sa?.nextSeasonIsEstimated === false ? 0 : fa !== Infinity ? 1 : 2;
          const ob = fb !== Infinity && sb?.nextSeasonIsEstimated === false ? 0 : fb !== Infinity ? 1 : 2;
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

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function GameGridInner({ games, seasons, cards, tableRows }: GameGridProps) {
  const t = useTranslations("sort");
  const tFilter = useTranslations("filter");
  const tTable = useTranslations("table");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>((searchParams.get("view") as ViewMode) ?? "grid");
  const [cardSort, setCardSort] = useState<CardSortKey>((searchParams.get("sort") as CardSortKey) ?? "nextSeason");
  const [tableSort, setTableSort] = useState<TableSortKey>((searchParams.get("tsort") as TableSortKey) ?? "started");
  const [tableSortDir, setTableSortDir] = useState<SortDir>((searchParams.get("tdir") as SortDir) ?? "desc");
  const [selectedGenre, setSelectedGenre] = useState<string>(searchParams.get("genre") ?? "");
  const [genreOpen, setGenreOpen] = useState(false);

  const allGenres = [...new Set(games.flatMap((g) => g.genres))].sort();
  const cardMap = Object.fromEntries(cards.map((c) => [c.gameId, c.node]));
  const rowMap = Object.fromEntries(tableRows.map((r) => [r.gameId, r.node]));

  const pushUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleView = (v: ViewMode) => { setView(v); pushUrl({ view: v }); };
  const handleCardSort = (k: CardSortKey) => { setCardSort(k); pushUrl({ sort: k }); };
  const handleGenre = (g: string) => { setSelectedGenre(g); setGenreOpen(false); pushUrl({ genre: g }); };

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

  const filteredIds = selectedGenre
    ? baseIds.filter((id) => games.find((g) => g.id === id)?.genres.includes(selectedGenre))
    : baseIds;

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
        {/* Left: Genre filter */}
        <div className="relative">
          <button
            onClick={() => setGenreOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 transition-colors min-w-32.5"
          >
            <span className="flex-1 text-left">{selectedGenre || tFilter("all")}</span>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform duration-150"
              style={{ transform: genreOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
          {genreOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setGenreOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 min-w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => handleGenre("")}
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-800"
                  style={{ color: selectedGenre === "" ? "#fff" : "#9ca3af" }}
                >
                  {tFilter("all")}
                </button>
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenre(genre)}
                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-800"
                    style={{ color: selectedGenre === genre ? "#fff" : "#9ca3af" }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: sort pills (grid only) + view toggle */}
        <div className="flex items-center gap-3">
          {view === "grid" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:block">{t("label")}:</span>
              <div className="flex gap-1.5">
                {cardSortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleCardSort(opt.key)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
                    style={
                      cardSort === opt.key
                        ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                        : { backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-0.5 border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => handleView("grid")}
              className="p-1.5 transition-colors"
              style={view === "grid" ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" } : { color: "#6b7280" }}
              title={tFilter("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleView("table")}
              className="p-1.5 transition-colors"
              style={view === "table" ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" } : { color: "#6b7280" }}
              title={tFilter("table")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIds.map((id) => cardMap[id])}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
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

// ── Public export wrapped in Suspense ─────────────────────────────────────────

export function GameGrid(props: GameGridProps) {
  return (
    <Suspense fallback={null}>
      <GameGridInner {...props} />
    </Suspense>
  );
}
