import { ExternalLink, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { CountdownTimer } from "./CountdownTimer";
import { ElapsedTimer } from "./ElapsedTimer";
import { SeasonBadge } from "./SeasonBadge";
import { GameImage } from "./GameImage";
import { PopularityBadge } from "./PopularityBadge";
import { formatDate, timeAgo } from "@/lib/utils";
import type { GameConfig, SeasonData } from "@/types";

interface GameCardProps {
  game: GameConfig;
  season: SeasonData | undefined;
}

export async function GameCard({ game, season }: GameCardProps) {
  const t = await getTranslations("dashboard");
  const tPop = await getTranslations("popularity");

  const startDate = season?.startDate ? new Date(season.startDate) : null;
  const endDate = season?.endDate ? new Date(season.endDate) : null;
  const nextDate = season?.nextSeasonStartDate
    ? new Date(season.nextSeasonStartDate)
    : null;

  return (
    <Card
      className="overflow-hidden bg-gray-900 flex flex-col hover:shadow-xl hover:shadow-black/60 transition-all duration-300"
      style={{ borderColor: `${game.glowColor}60`, borderWidth: "1.5px" }}
    >
      {/* ── Game image ── */}
      <div className="relative h-36 overflow-hidden shrink-0 bg-gray-800">
        <GameImage
          src={game.coverImage}
          alt={game.name}
          glowColor={game.glowColor}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-gray-900" />
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: game.glowColor }}
        />
        {season && (
          <div className="absolute top-3 right-3">
            <SeasonBadge status={season.status} />
          </div>
        )}
      </div>

      {/* Left accent bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-0.5"
        style={{ backgroundColor: `${game.glowColor}80` }}
      />

      {/* ── Card body ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">
        {/* Title */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
            {game.developer}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h2
              className="text-lg font-bold leading-tight"
              style={{ color: game.glowColor }}
            >
              {game.name}
            </h2>
            <PopularityBadge score={game.popularityScore} glowColor={game.glowColor} tooltip={tPop("tooltip")} />
          </div>
        </div>

        {season && !season.error ? (
          <>
            {/* Season name */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                {t("currentSeason", { seasonType: game.seasonType })}
              </p>
              <p className="text-white font-semibold text-sm leading-tight">
                {season.seasonName}
                {season.seasonNumber ? (
                  <span className="text-gray-400 font-normal ml-1">
                    #{season.seasonNumber}
                  </span>
                ) : null}
              </p>
            </div>

            {/* Start / End dates */}
            <div className="grid grid-cols-2 gap-2">
              {season.startDate && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                    {t("started")}
                  </p>
                  <p className="text-gray-200 text-xs">
                    {formatDate(season.startDate)}
                  </p>
                </div>
              )}
              {season.endDate && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                    {t("ends")}
                  </p>
                  <p className="text-gray-200 text-xs">
                    {formatDate(season.endDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Next season row */}
            {season.nextSeasonStartDate && (
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
                  {formatDate(season.nextSeasonStartDate)}
                </span>
                {season.nextSeasonIsEstimated &&
                  season.avgSeasonDurationDays && (
                    <span className="text-gray-500 ml-auto">
                      ~{season.avgSeasonDurationDays}d avg
                    </span>
                  )}
              </div>
            )}

            {/* ── Two timers ── */}
            <div className="grid grid-cols-2 gap-2">
              {/* Elapsed — how long the season has been running */}
              {startDate && season.status === "active" && (
                <ElapsedTimer startDate={startDate} label={t("runningFor")} />
              )}

              {/* Countdown — to next season or end */}
              {(nextDate || endDate) && (
                <CountdownTimer
                  targetDate={(nextDate ?? endDate)!}
                  label={
                    nextDate
                      ? t("nextSeasonIn", { seasonType: game.seasonType })
                      : t("endsIn")
                  }
                  accentColor={game.accentColor}
                />
              )}
            </div>

            {/* Description */}
            {season.description && (
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-auto">
                {season.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto">
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
                <span className="text-gray-600 text-xs">
                  {timeAgo(season.fetchedAt)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center py-2">
            <p className="text-gray-500 text-sm mb-2">{t("unavailable")}</p>
            {season?.error && (
              <p className="text-red-400/60 text-xs mb-3">
                {season.error.slice(0, 80)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <a
                href={game.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: game.glowColor }}
              >
                {t("checkOfficialSite")} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
