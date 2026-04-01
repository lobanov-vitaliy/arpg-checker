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
    <Card
      className="overflow-hidden bg-gray-900/60 backdrop-blur-md border border-white/5 flex flex-col transition-colors duration-300 hover:border-(--gc)"
      style={{ "--gc": game.glowColor } as React.CSSProperties}
    >
      {/* ── Game image ── */}
      <div className="relative h-36 overflow-hidden shrink-0 bg-gray-800">
        <a
          href={`/${locale}/game/${game.id}`}
          className="block w-full h-full group"
        >
          <GameImage
            src={game.coverImage}
            alt={game.name}
            glowColor={game.glowColor}
          />
        </a>

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {isFirstSeason && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-sm border border-white/10 text-white">
              <Sparkles
                className="w-2.5 h-2.5"
                style={{ color: game.glowColor }}
              />
              {t("newGame")}
            </div>
          )}
          <div className="bg-black/60 backdrop-blur-sm rounded-full">
            <FavoriteButton gameId={game.id} />
          </div>
        </div>
      </div>

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
            <PopularityBadge
              score={game.popularityScore}
              glowColor={game.glowColor}
              tooltip={tPop("tooltip")}
            />
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

        {/* Official site + icons — pinned to bottom */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
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
              className="text-gray-600 hover:text-gray-400 transition-colors"
              title="Countdown"
            >
              <Timer className="w-3.5 h-3.5" />
            </a>
            <a
              href={`/${locale}/calendar?game=${game.id}`}
              className="text-gray-600 hover:text-gray-400 transition-colors"
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
