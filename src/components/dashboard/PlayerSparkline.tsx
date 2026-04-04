"use client";

import {
  AreaChart,
  Area,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";
import { toIntlLocale } from "@/lib/utils";
import type { SteamData, PlayerSnapshot } from "@/types";

interface PlayerSparklineProps {
  steam: SteamData;
  glowColor: string;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getSeasonData(
  snapshots: PlayerSnapshot[],
  seasonStart?: string | null,
  seasonEnd?: string | null,
): { data: PlayerSnapshot[]; hasSeasonFilter: boolean } {
  if (!seasonStart) return { data: snapshots, hasSeasonFilter: false };
  const from = new Date(seasonStart).getTime();
  const to = seasonEnd ? new Date(seasonEnd).getTime() : Date.now();
  const filtered = snapshots.filter((s) => {
    const t = new Date(s.t).getTime();
    return t >= from && t <= to;
  });
  return { data: filtered.length >= 2 ? filtered : [], hasSeasonFilter: true };
}


function SparkTooltip({
  active,
  payload,
  locale,
}: {
  active?: boolean;
  payload?: { value: number; payload: { t: string } }[];
  locale: string;
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: pt } = payload[0];
  const date = new Date(pt.t).toLocaleDateString(toIntlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 shadow-xl pointer-events-none">
      <p className="text-white text-xs font-semibold">{formatCount(value)}</p>
      <p className="text-gray-400 text-[10px]">{date}</p>
    </div>
  );
}

export function PlayerSparkline({
  steam,
  glowColor,
  seasonStart,
  seasonEnd,
}: PlayerSparklineProps) {
  const t = useTranslations("players");
  const locale = useLocale();
  const { data, hasSeasonFilter } = getSeasonData(
    steam.snapshots ?? [],
    seasonStart,
    seasonEnd,
  );

  if (data.length < 2) {
    return (
      <p className="text-xs text-gray-600 py-1">
        {hasSeasonFilter ? t("noDataSeason") : t("noData")}
      </p>
    );
  }

  const values = data.map((s) => s.p);
  const peak = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const gradId = `spark-${steam.gameId}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-white font-bold text-sm">
            {formatCount(steam.currentPlayers)}
          </span>
          <span className="text-gray-500 text-xs">{t("online")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 text-xs">{t("avgSeason")} {formatCount(avg)}</span>
          <span className="text-gray-600 text-xs">{t("peak")} {formatCount(peak)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={glowColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <ReferenceLine
            y={avg}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />
          <Tooltip
            content={<SparkTooltip locale={locale} />}
            cursor={{ stroke: `${glowColor}60`, strokeWidth: 1 }}
          />
<Area
            type="monotone"
            dataKey="p"
            stroke={glowColor}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{
              r: 3,
              fill: glowColor,
              stroke: "#111827",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
