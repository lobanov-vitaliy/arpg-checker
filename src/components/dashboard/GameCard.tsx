import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
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

  const allSeasons = getSeasonsForGame(game.id);
  const steamData = game.steamAppId
    ? await getCached<SteamData>(STEAM_CACHE_KEY(game.id))
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
      </div>

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
        <div className="flex flex-col justify-center">
          <a
            href={game.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:underline"
            style={{ color: game.glowColor }}
          >
            <ExternalLink className="w-3 h-3" /> {t("checkOfficialSite")}
          </a>
        </div>
      </div>
    </Card>
  );
}
