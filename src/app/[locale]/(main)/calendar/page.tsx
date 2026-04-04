import { getTranslations } from "next-intl/server";
import { getAllSeasons, getSeasonsForGame } from "@/lib/seasons";
import { getGames } from "@/config/games";
import {
  CalendarGrid,
  type CalendarEvent,
  type CalendarGame,
} from "@/components/calendar/CalendarGrid";

export default async function CalendarPage() {
  const t = await getTranslations("calendar");
  const [seasons, allGames] = await Promise.all([getAllSeasons(), getGames()]);
  const gameById = Object.fromEntries(allGames.map((g) => [g.id, g]));
  const now = Date.now();

  const events: CalendarEvent[] = [];

  for (const season of seasons) {
    const game = gameById[season.gameId];
    if (!game || !season.startDate) continue;

    const base = {
      gameId: game.id,
      gameName: game.name,
      glowColor: game.glowColor,
      seasonName: season.seasonName,
    };

    if (season.status === "active" || season.status === "upcoming") {
      events.push({ ...base, date: season.startDate, type: "starts" });
    }

    if (season.status === "active" && season.endDate) {
      if (new Date(season.endDate).getTime() > now) {
        events.push({ ...base, date: season.endDate, type: "ends" });
      }
    }

    if (
      season.nextSeasonStartDate &&
      new Date(season.nextSeasonStartDate).getTime() > now &&
      season.nextSeasonStartDate !== season.startDate
    ) {
      const gameSeasons = await getSeasonsForGame(game.id);
      const nextEntry = gameSeasons.find(
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

  const games: CalendarGame[] = allGames.map((g) => ({
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
