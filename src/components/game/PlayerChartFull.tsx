"use client";

import {
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";
import { toIntlLocale } from "@/lib/utils";
import type { SteamData, PlayerSnapshot } from "@/types";

interface PlayerChartFullProps {
  steam: SteamData;
  glowColor: string;
  seasonStart?: string | null;
  seasonEnd?: string | null;
  seasonLabel: string;
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


function ChartTooltip({
  active,
  payload,
  glowColor,
  playersOnlineLabel,
  locale,
}: {
  active?: boolean;
  payload?: { value: number; payload: { t: string } }[];
  glowColor: string;
  playersOnlineLabel: string;
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-2xl pointer-events-none">
      <p className="text-xs text-gray-400 mb-0.5">{date}</p>
      <p className="text-base font-bold" style={{ color: glowColor }}>
        {formatCount(value)}
      </p>
      <p className="text-[10px] text-gray-500">{playersOnlineLabel}</p>
    </div>
  );
}

export function PlayerChartFull({
  steam,
  glowColor,
  seasonStart,
  seasonEnd,
  seasonLabel,
}: PlayerChartFullProps) {
  const t = useTranslations("players");
  const locale = useLocale();
  const { data, hasSeasonFilter } = getSeasonData(
    steam.snapshots,
    seasonStart,
    seasonEnd,
  );

  if (data.length < 2) {
    return (
      <p className="text-sm text-gray-500 py-4">
        {hasSeasonFilter ? t("noDataSeason") : t("notEnoughData")}
      </p>
    );
  }

  const values = data.map((s) => s.p);
  const last = values[values.length - 1] ?? 0;
  const prev = values[Math.max(0, values.length - 49)] ?? last;
  const trendPct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  const trendUp = trendPct >= 0;
  const peakShown = Math.max(...values);

  const gradId = `chart-full-${steam.gameId}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {formatCount(steam.currentPlayers)}
          </span>
          <span className="text-gray-500 text-sm">{t("playingNow")}</span>
          {hasSeasonFilter && (
            <span className="text-[10px] text-gray-600 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded">
              {seasonLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {values.length > 48 && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${trendUp ? "text-emerald-400" : "text-red-400"}`}
              >
                {trendUp ? "▲" : "▼"} {Math.abs(trendPct).toFixed(1)}%
              </span>
              <span className="text-gray-600 text-xs">{t("trend48h")}</span>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-500">{t("peak7d")} </span>
            <span className="text-xs font-semibold text-gray-300">
              {formatCount(steam.peakPlayers7d)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500">{t("seasonPeak")} </span>
            <span className="text-xs font-semibold text-gray-300">
              {formatCount(peakShown)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={glowColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={
                  props.payload as unknown as {
                    value: number;
                    payload: { t: string };
                  }[]
                }
                glowColor={glowColor}
                playersOnlineLabel={t("playersOnline")}
                locale={locale}
              />
            )}
            cursor={{ stroke: `${glowColor}40`, strokeWidth: 1 }}
          />
<Area
            type="monotone"
            dataKey="p"
            stroke={glowColor}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: glowColor,
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-gray-700 text-right">
        {t("updated")}{" "}
        {new Date(steam.updatedAt).toLocaleTimeString(toIntlLocale(locale), {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
