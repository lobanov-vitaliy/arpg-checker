"use client";

import { useState } from "react";
import { CountdownTimer } from "./CountdownTimer";
import { ElapsedTimer } from "./ElapsedTimer";
import { useTranslations } from "next-intl";
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

export function SeasonSwitcher({ seasons, game, steam, playersOnlineLabel }: SeasonSwitcherProps) {
  const t = useTranslations("dashboard");
  const tEst = useTranslations("estimate");
  const [idx, setIdx] = useState(0);

  const season = seasons[idx];
  const now = Date.now();

  const startDate = season.startDate ? new Date(season.startDate) : null;
  const endDate = season.endDate ? new Date(season.endDate) : null;
  const nextDateRaw = season.nextSeasonStartDate ? new Date(season.nextSeasonStartDate) : null;
  const nextDate = nextDateRaw && nextDateRaw.getTime() > now ? nextDateRaw : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Season name + pagination dots */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
          {t("currentSeason", { seasonType: game.seasonType })}
        </p>
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {season.seasonName}
          {season.seasonNumber ? (
            <span className="text-gray-400 font-normal ml-1">#{season.seasonNumber}</span>
          ) : null}
        </p>
        {seasons.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2">
            {seasons.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="transition-all duration-200 rounded-full text-xs font-medium"
                style={{
                  height: "16px",
                  padding: "0 6px",
                  minWidth: "16px",
                  fontSize: "10px",
                  backgroundColor: i === idx ? game.glowColor : `${game.glowColor}25`,
                  color: i === idx ? "#000" : `${game.glowColor}90`,
                }}
              >
                {i === 0 ? "live" : seasons[i].seasonNumber ? `#${seasons[i].seasonNumber}` : i + 1}
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
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">{t("started")}</p>
            <p className="text-gray-200 text-xs">{formatDate(season.startDate)}</p>
          </div>
        )}
        {season.endDate && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">{t("ends")}</p>
            <p className="text-gray-200 text-xs">{formatDate(season.endDate)}</p>
          </div>
        )}
      </div>

      {/* Next season row — only if in future */}
      {season.nextSeasonStartDate && nextDateRaw && nextDateRaw.getTime() > now && (
        <div
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
          style={{ backgroundColor: `${game.glowColor}15`, border: `1px solid ${game.glowColor}30` }}
        >
          <Clock className="w-3 h-3 shrink-0 text-gray-400" />
          <span className="text-gray-400">{t("nextSeason", { seasonType: game.seasonType })}:</span>
          <span className="text-gray-100 font-medium">{formatDate(season.nextSeasonStartDate)}</span>
          {season.nextSeasonIsEstimated && season.avgSeasonDurationDays && (
            <span className="relative group ml-auto cursor-default">
              <span className="text-gray-500">
                {tEst("avgLabel", { days: season.avgSeasonDurationDays })}
              </span>
              <span className="absolute bottom-full right-0 mb-1.5 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span className="block bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
                  {tEst("tooltip", { seasonType: game.seasonType, days: season.avgSeasonDurationDays })}
                </span>
              </span>
            </span>
          )}
        </div>
      )}

      {/* Timers — only for active/upcoming seasons */}
      {season.status !== "ended" && (
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
          ) : nextDateRaw && nextDateRaw.getTime() <= now ? (
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                {t("nextSeasonIn", { seasonType: game.seasonType })}
              </p>
              <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Steam sparkline — filtered by current season dates */}
      {steam && steam.snapshots.length > 0 && (
        <div
          className="rounded-md px-2.5 py-2"
          style={{ backgroundColor: `${game.glowColor}08`, border: `1px solid ${game.glowColor}20` }}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            {playersOnlineLabel}
          </p>
          <PlayerSparkline
            steam={steam}
            glowColor={game.glowColor}
            seasonStart={season.startDate}
            seasonEnd={season.endDate}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2">
        {season.confidence === "low" && (
          <a
            href={game.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-yellow-500/70 hover:text-yellow-400 text-xs transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {t("verify")}
          </a>
        )}
      </div>
    </div>
  );
}
