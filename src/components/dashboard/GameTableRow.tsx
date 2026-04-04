import { ExternalLink } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { SeasonBadge } from "./SeasonBadge";
import { getSteamData } from "@/lib/steam-fetcher";
import { formatDate } from "@/lib/utils";
import type { GameConfig, SeasonData, SteamData } from "@/types";

interface GameTableRowProps {
  game: GameConfig;
  season: SeasonData | undefined;
}

export async function GameTableRow({ game, season }: GameTableRowProps) {
  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);

  const steamData = game.steamAppId
    ? await getSteamData(game.id)
    : null;

  const now = Date.now();
  const nextDate =
    season?.nextSeasonStartDate &&
    new Date(season.nextSeasonStartDate).getTime() > now
      ? season.nextSeasonStartDate
      : null;

  return (
    <tr className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors group">
      {/* Game */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* Round avatar */}
          <div
            className="w-8 h-8 rounded-full shrink-0 overflow-hidden border-2"
            style={{ borderColor: game.glowColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.coverImage}
              alt={game.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-tight">{game.name}</p>
            <p className="text-gray-500 text-xs">{game.developer}</p>
          </div>
        </div>
      </td>

      {/* Genres */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {game.genres.map((g) => (
            <span
              key={g}
              className="px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-400 whitespace-nowrap"
            >
              {g}
            </span>
          ))}
        </div>
      </td>

      {/* Season */}
      <td className="py-3 px-4 whitespace-nowrap">
        {season ? (
          <span className="text-gray-200 text-xs">
            {season.seasonName}
            {season.seasonNumber ? (
              <span className="text-gray-500 ml-1">#{season.seasonNumber}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </td>

      {/* Started */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-gray-400 text-xs">
          {season?.startDate ? formatDate(season.startDate, locale) : "—"}
        </span>
      </td>

      {/* Ends */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-gray-400 text-xs">
          {season?.endDate ? formatDate(season.endDate, locale) : "—"}
        </span>
      </td>

      {/* Next season */}
      <td className="py-3 px-4 whitespace-nowrap">
        {nextDate ? (
          <span className="text-gray-300 text-xs">{formatDate(nextDate, locale)}</span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </td>

      {/* Players online */}
      <td className="py-3 px-4 whitespace-nowrap">
        {steamData?.currentPlayers != null ? (
          <span className="text-gray-300 text-xs">
            {steamData.currentPlayers.toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </td>

      {/* Popularity */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-xs font-medium" style={{ color: game.glowColor }}>
          {game.popularityScore}
        </span>
      </td>

      {/* Link */}
      <td className="py-3 px-4">
        <a
          href={game.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-300 transition-colors"
          title={t("checkOfficialSite")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </td>
    </tr>
  );
}
