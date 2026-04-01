import { getTranslations } from "next-intl/server";
import { getAllSeasons } from "@/lib/seasons";
import { GAMES, GAMES_BY_ID } from "@/config/games";
import { GAME_SEASONS } from "@/data/seasons";
import {
  CalendarGrid,
  type CalendarEvent,
  type CalendarGame,
} from "@/components/calendar/CalendarGrid";

export default async function CalendarPage() {
  const t = await getTranslations("calendar");
  const seasons = getAllSeasons();
  const now = Date.now();

  const events: CalendarEvent[] = [];

  for (const season of seasons) {
    const game = GAMES_BY_ID[season.gameId];
    if (!game || !season.startDate) continue;

    const base = {
      gameId: game.id,
      gameName: game.name,
      glowColor: game.glowColor,
      seasonName: season.seasonName,
    };

    // Season start (active and upcoming)
    if (season.status === "active" || season.status === "upcoming") {
      events.push({ ...base, date: season.startDate, type: "starts" });
    }

    // Active season end (only if known and in the future)
    if (season.status === "active" && season.endDate) {
      if (new Date(season.endDate).getTime() > now) {
        events.push({ ...base, date: season.endDate, type: "ends" });
      }
    }

    // Next season start (future, not duplicate of current start)
    if (
      season.nextSeasonStartDate &&
      new Date(season.nextSeasonStartDate).getTime() > now &&
      season.nextSeasonStartDate !== season.startDate
    ) {
      const gameSeasons = GAME_SEASONS.find((g) => g.gameId === game.id);
      const nextEntry = gameSeasons?.seasons.find(
        (s) => s.startDate === season.nextSeasonStartDate,
      );
      events.push({
        ...base,
        date: season.nextSeasonStartDate,
        seasonName: nextEntry?.seasonName ?? `${t("next")} ${game.seasonType}`,
        type: "starts",
        isEstimated: season.nextSeasonIsEstimated ?? false,
        avgSeasonDurationDays: season.nextSeasonIsEstimated
          ? (season.avgSeasonDurationDays ?? null)
          : null,
        seasonType: game.seasonType,
      });
    }
  }

  const games: CalendarGame[] = GAMES.map((g) => ({
    id: g.id,
    name: g.name,
    glowColor: g.glowColor,
  }));

  const today = new Date();

  return (
    <main className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-8">{t("subtitle")}</p>
        <CalendarGrid
          events={events}
          games={games}
          initialYear={today.getFullYear()}
          initialMonth={today.getMonth()}
        />
      </div>
    </main>
  );
}
