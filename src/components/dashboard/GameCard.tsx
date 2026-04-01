import { ExternalLink, Sparkles, CalendarDays, Timer } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { Card } from "@/components/ui/card";
import { getTranslations, getLocale } from "next-intl/server";
import { GameImage } from "./GameImage";
import { PopularityBadge } from "./PopularityBadge";
import { SeasonSwitcher } from "./SeasonSwitcher";
import { getCached } from "@/lib/cache";
import { STEAM_CACHE_KEY } from "@/lib/steam-fetcher";
import { getSeasonsForGame } from "@/lib/seasons";
import type { GameConfig, SteamData } from "@/types";
import { SteamReviewBadge } from "./SteamReviewBadge";

interface GameCardProps {
  game: GameConfig;
}

export async function GameCard({ game }: GameCardProps) {
  const t = await getTranslations("dashboard");
  const tPop = await getTranslations("popularity");

  const [locale, allSeasons] = await Promise.all([
    getLocale(),
    Promise.resolve(getSeasonsForGame(game.id)),
  ]);
  const isFirstSeason = allSeasons.some(
    (s) =>
      (s.status === "active" || s.status === "upcoming") &&
      s.seasonNumber === 1,
  );
  const steamData = game.steamAppId
    ? await getCached<SteamData>(STEAM_CACHE_KEY(game.id))
    : null;

  return (
    <Card className="overflow-hidden bg-gray-900 flex flex-col hover:shadow-xl hover:shadow-black/60 transition-all duration-300">
      {/* ── Game image ── */}
      <a
        href={`/${locale}/game/${game.id}`}
        className="relative h-36 overflow-hidden shrink-0 bg-gray-800 block group"
      >
        <GameImage
          src={game.coverImage}
          alt={game.name}
          glowColor={game.glowColor}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-gray-900 group-hover:from-black/20 transition-all" />
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: game.glowColor }}
        />
        {isFirstSeason && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-sm border border-white/10 text-white">
            <Sparkles
              className="w-2.5 h-2.5"
              style={{ color: game.glowColor }}
            />
            {t("newGame")}
          </div>
        )}
      </a>

      {/* ── Card body ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">
        {/* Title */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
            {game.developer}
          </p>
          <div className="flex items-center justify-between gap-2">
            <a href={`/${locale}/game/${game.id}`}>
              <h2
                className="text-lg font-bold leading-tight hover:underline"
                style={{ color: game.glowColor }}
              >
                {game.name}
              </h2>
            </a>
            <div className="flex items-center gap-1">
              <FavoriteButton gameId={game.id} />
              <PopularityBadge
                score={game.popularityScore}
                glowColor={game.glowColor}
                tooltip={tPop("tooltip")}
              />
            </div>
          </div>
          <SteamReviewBadge rating={steamData?.rating ?? null} />
        </div>

        {allSeasons.length > 0 && (
          <SeasonSwitcher
            seasons={allSeasons}
            game={game}
            steam={steamData}
            playersOnlineLabel={t("playersOnline")}
          />
        )}
        <div className="flex items-center justify-between gap-2">
          <a
            href={game.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:underline"
            style={{ color: game.glowColor }}
          >
            <ExternalLink className="w-3 h-3" /> {t("checkOfficialSite")}
          </a>
          <div className="flex items-center gap-2">
            <a
              href={`/${locale}/countdown/${game.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              title="Countdown"
            >
              <Timer className="w-3.5 h-3.5" />
            </a>
            <a
              href={`/${locale}/calendar?game=${game.id}`}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              title={t("viewCalendar")}
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
