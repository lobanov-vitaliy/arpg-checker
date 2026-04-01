"use client";

import { useState, useEffect } from "react";
import { CountdownTimer } from "./CountdownTimer";
import { ElapsedTimer } from "./ElapsedTimer";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Clock } from "lucide-react";
import type { SeasonData, GameConfig, SteamData } from "@/types";
import { PlayerSparkline } from "./PlayerSparkline";

interface SeasonSwitcherProps {
  seasons: SeasonData[];
  game: GameConfig;
  steam?: SteamData | null;
  playersOnlineLabel: string;
}

export function SeasonSwitcher({
  seasons,
  game,
  steam,
  playersOnlineLabel,
}: SeasonSwitcherProps) {
  const t = useTranslations("dashboard");
  const tEst = useTranslations("estimate");
  const locale = useLocale();

  // Display order: upcoming first, active second ("live"), ended rest
  const displaySeasons = [
    ...seasons.filter((s) => s.status === "upcoming"),
    ...seasons.filter((s) => s.status === "active"),
    ...seasons.filter((s) => s.status !== "upcoming" && s.status !== "active"),
  ];

  // Default to the active ("live") season
  const liveIdx = displaySeasons.findIndex((s) => s.status === "active");
  const [idx, setIdx] = useState(liveIdx >= 0 ? liveIdx : 0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const season = displaySeasons[idx];

  const startDate = season.startDate ? new Date(season.startDate) : null;
  const endDate = season.endDate ? new Date(season.endDate) : null;
  const nextDateRaw = season.nextSeasonStartDate
    ? new Date(season.nextSeasonStartDate)
    : null;
  const nextDate =
    nextDateRaw && nextDateRaw.getTime() > now ? nextDateRaw : null;

  function dotLabel(s: SeasonData, i: number) {
    if (s.status === "upcoming") return t("coming");
    if (s.status === "active") return t("current");
    return s.seasonNumber ? `#${s.seasonNumber}` : String(i + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Season name + pagination */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
          {season.status === "upcoming"
            ? t("nextSeason", { seasonType: game.seasonType })
            : season.status === "ended"
              ? t("previousSeason", { seasonType: game.seasonType })
              : t("currentSeason", { seasonType: game.seasonType })}
        </p>
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {season.seasonName}
          {season.seasonNumber ? (
            <span className="text-gray-400 font-normal ml-1">
              #{season.seasonNumber}
            </span>
          ) : null}
        </p>

        {displaySeasons.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2">
            {displaySeasons.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full font-medium"
                style={{
                  height: i === idx ? "18px" : "16px",
                  padding: "0 7px",
                  minWidth: i === idx ? "18px" : "16px",
                  fontSize: i === idx ? "11px" : "10px",
                  backgroundColor:
                    i === idx ? game.glowColor : `${game.glowColor}25`,
                  color: i === idx ? "#000" : `${game.glowColor}90`,
                }}
              >
                {dotLabel(s, i)}
              </button>
            ))}
          </div>
        )}

        {season.description && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-2">
            {season.description}
          </p>
        )}
      </div>

      {/* Start / End dates */}
      <div className="grid grid-cols-2 gap-2">
        {season.startDate && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
              {season.status === "upcoming" ? t("starts") : t("started")}
            </p>
            <p className="text-gray-200 text-xs">
              {formatDate(season.startDate, locale)}
            </p>
          </div>
        )}
        {season.endDate && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
              {t("ends")}
            </p>
            <p className="text-gray-200 text-xs">
              {formatDate(season.endDate, locale)}
            </p>
          </div>
        )}
      </div>

      {/* Next season row — only for active season, only if next date is in future */}
      {season.status === "active" &&
        nextDateRaw &&
        nextDateRaw.getTime() > now && (
          <div
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
            style={{
              backgroundColor: `${game.glowColor}15`,
              border: `1px solid ${game.glowColor}30`,
            }}
          >
            <Clock className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="text-gray-400">
              {t("nextSeason", { seasonType: game.seasonType })}:
            </span>
            <span className="text-gray-100 font-medium">
              {formatDate(season.nextSeasonStartDate!, locale)}
            </span>
            <span className="ml-auto relative group cursor-default shrink-0">
              {season.nextSeasonIsEstimated ? (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500/70">
                    {t("estimated")}
                  </span>
                  {season.avgSeasonDurationDays && (
                    <span className="absolute bottom-full right-0 mb-1.5 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="block bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
                        {tEst("tooltip", {
                          seasonType: game.seasonType,
                          days: season.avgSeasonDurationDays,
                        })}
                      </span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500/70">
                    {t("official")}
                  </span>
                  <span className="absolute bottom-full right-0 mb-1.5 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="block bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
                      {t("officialTooltip")}
                    </span>
                  </span>
                </>
              )}
            </span>
          </div>
        )}

      {/* Timers */}
      {season.status === "upcoming" && startDate ? (
        // Upcoming: countdown to season start
        <div className="grid grid-cols-1">
          <CountdownTimer
            targetDate={startDate}
            label={t("startsIn")}
            accentColor={game.accentColor}
            isEstimated={false}
          />
        </div>
      ) : season.status !== "ended" ? (
        // Active: elapsed + ends-in / next-season timers
        <div className="grid grid-cols-2 gap-2">
          {startDate && season.status === "active" && (
            <ElapsedTimer startDate={startDate} label={t("runningFor")} />
          )}
          {nextDate ? (
            <CountdownTimer
              targetDate={nextDate}
              label={t("nextSeasonIn", { seasonType: game.seasonType })}
              accentColor={game.accentColor}
              isEstimated={season.nextSeasonIsEstimated ?? true}
            />
          ) : endDate ? (
            <CountdownTimer
              targetDate={endDate}
              label={t("endsIn")}
              accentColor={game.accentColor}
              isEstimated={false}
            />
          ) : (
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                {t("nextSeasonIn", { seasonType: game.seasonType })}
              </p>
              <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            {t("nextSeasonIn", { seasonType: game.seasonType })}
          </p>
          <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
        </div>
      )}

      {/* Steam sparkline */}
      {season.status !== "upcoming" && game.steamAppId && (
        <div
          className="rounded-md px-2.5 py-2"
          style={{
            backgroundColor: `${game.glowColor}08`,
            border: `1px solid ${game.glowColor}20`,
          }}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            {playersOnlineLabel}
          </p>
          {steam && steam.snapshots.length > 0 ? (
            <PlayerSparkline
              steam={steam}
              glowColor={game.glowColor}
              seasonStart={season.startDate}
              seasonEnd={season.endDate}
            />
          ) : (
            <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
          )}
        </div>
      )}
    </div>
  );
}
