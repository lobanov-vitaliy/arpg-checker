"use client";

import { useEffect, useState } from "react";
import type { SeasonData } from "@/types";

interface SeasonProgressBarProps {
  season: SeasonData;
  glowColor: string;
  label: string;
}

function computeProgress(season: SeasonData): number | null {
  const start = season.startDate ? new Date(season.startDate).getTime() : null;
  const end =
    season.endDate
      ? new Date(season.endDate).getTime()
      : season.nextSeasonStartDate
        ? new Date(season.nextSeasonStartDate).getTime()
        : null;

  if (!start || !end) return null;
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function SeasonProgressBar({ season, glowColor, label }: SeasonProgressBarProps) {
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    setPct(computeProgress(season));
    const id = setInterval(() => setPct(computeProgress(season)), 60_000);
    return () => clearInterval(id);
  }, [season]);

  if (pct === null) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold" style={{ color: glowColor }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            backgroundColor: glowColor,
            boxShadow: `0 0 8px ${glowColor}60`,
          }}
        />
      </div>
    </div>
  );
}
