"use client";

import { Sparkles } from "lucide-react";
import { GameCardLinks } from "./GameCardLinks";
import { FavoriteButton } from "./FavoriteButton";
import { LikeButton } from "./LikeButton";
import { Card } from "@/components/ui/card";
import { useTranslations, useLocale } from "next-intl";
import { GameImage } from "./GameImage";
import { PopularityBadge } from "./PopularityBadge";
import { SeasonSwitcher } from "./SeasonSwitcher";
import { SteamReviewBadge } from "./SteamReviewBadge";
import type { GameConfig, SeasonData, SteamData } from "@/types";

interface Props {
  game: GameConfig;
  seasons: SeasonData[];
  likes: number;
  steam: SteamData | null;
}

export function GameCardClient({ game, seasons, likes, steam }: Props) {
  const t = useTranslations("dashboard");
  const tPop = useTranslations("popularity");
  const locale = useLocale();

  const isFirstSeason =
    seasons.length === 1 &&
    seasons[0].seasonNumber === 1 &&
    (seasons[0].status === "active" || seasons[0].status === "upcoming");

  return (
    <Card
      className="overflow-hidden bg-gray-900/60 backdrop-blur-md border border-white/5 flex flex-col transition-colors duration-300 hover:border-(--gc)"
      style={{ "--gc": game.glowColor } as React.CSSProperties}
    >
      {/* Game image */}
      <div className="relative h-36 overflow-hidden shrink-0 bg-gray-800">
        <a href={`/${locale}/game/${game.id}`} className="block w-full h-full group">
          <GameImage src={game.coverImage} alt={game.name} glowColor={game.glowColor} />
        </a>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {isFirstSeason && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-sm border border-white/10 text-white">
              <Sparkles className="w-2.5 h-2.5" style={{ color: game.glowColor }} />
              {t("newGame")}
            </div>
          )}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-1">
            <LikeButton gameId={game.id} initialCount={likes} />
            <FavoriteButton gameId={game.id} />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">
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
          <SteamReviewBadge rating={steam?.rating ?? null} />
        </div>

        {seasons.length > 0 && (
          <SeasonSwitcher
            seasons={seasons}
            game={game}
            steam={steam}
            playersOnlineLabel={t("playersOnline")}
          />
        )}

        <GameCardLinks
          gameId={game.id}
          gameName={game.name}
          officialUrl={game.officialUrl}
          countdownHref={`/${locale}/countdown/${game.id}`}
          calendarHref={`/${locale}/calendar?game=${game.id}`}
          glowColor={game.glowColor}
          officialLabel={t("checkOfficialSite")}
          calendarTitle={t("viewCalendar")}
        />
      </div>
    </Card>
  );
}
