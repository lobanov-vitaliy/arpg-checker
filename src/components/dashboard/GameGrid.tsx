"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { GameConfig, SeasonData } from "@/types";
import type { ReactNode } from "react";

type SortKey = "popularity" | "recentStart" | "nextSeason";

interface GameGridProps {
  games: GameConfig[];
  seasons: SeasonData[];
  cards: { gameId: string; node: ReactNode }[];
}

function getSortedIds(games: GameConfig[], seasons: SeasonData[], key: SortKey): string[] {
  const seasonMap = Object.fromEntries(seasons.map((s) => [s.gameId, s]));

  return [...games]
    .sort((a, b) => {
      const sa = seasonMap[a.id];
      const sb = seasonMap[b.id];

      if (key === "popularity") {
        return b.popularityScore - a.popularityScore;
      }

      if (key === "recentStart") {
        const da = sa?.startDate ? new Date(sa.startDate).getTime() : 0;
        const db = sb?.startDate ? new Date(sb.startDate).getTime() : 0;
        return db - da;
      }

      if (key === "nextSeason") {
        const now = Date.now();
        const na = sa?.nextSeasonStartDate ? new Date(sa.nextSeasonStartDate).getTime() : null;
        const nb = sb?.nextSeasonStartDate ? new Date(sb.nextSeasonStartDate).getTime() : null;
        const fa = na && na > now ? na : Infinity;
        const fb = nb && nb > now ? nb : Infinity;
        return fa - fb;
      }

      return 0;
    })
    .map((g) => g.id);
}

export function GameGrid({ games, seasons, cards }: GameGridProps) {
  const t = useTranslations("sort");
  const [sortKey, setSortKey] = useState<SortKey>("recentStart");

  const cardMap = Object.fromEntries(cards.map((c) => [c.gameId, c.node]));
  const sortedIds = getSortedIds(games, seasons, sortKey);

  const options: { key: SortKey; label: string }[] = [
    { key: "popularity", label: t("popularity") },
    { key: "recentStart", label: t("recentStart") },
    { key: "nextSeason", label: t("nextSeason") },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{t("label")}:</span>
        <div className="flex gap-1.5">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
              style={
                sortKey === opt.key
                  ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                  : { backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedIds.map((id) => cardMap[id])}
      </div>
    </div>
  );
}
