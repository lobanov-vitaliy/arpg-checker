import { getTranslations } from "next-intl/server";
import { GAMES } from "@/config/games";
import { GameGrid } from "@/components/dashboard/GameGrid";
import { GameCard } from "@/components/dashboard/GameCard";
import { GameTableRow } from "@/components/dashboard/GameTableRow";
import { getAllSeasons } from "@/lib/seasons";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, sp] = await Promise.all([getTranslations("dashboard"), searchParams]);
  const seasons = getAllSeasons();
  const initialParams = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])
  );

  const [cards, tableRows] = await Promise.all([
    Promise.all(
      GAMES.map(async (game) => ({
        gameId: game.id,
        node: <GameCard key={game.id} game={game} />,
      })),
    ),
    Promise.all(
      GAMES.map(async (game) => ({
        gameId: game.id,
        node: (
          <GameTableRow
            key={game.id}
            game={game}
            season={seasons.find((s) => s.gameId === game.id)}
          />
        ),
      })),
    ),
  ]);

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400 text-sm">{t("subtitle")}</p>
      </div>
      <GameGrid
        games={GAMES}
        seasons={seasons}
        cards={cards}
        tableRows={tableRows}
        initialParams={initialParams}
      />
    </main>
  );
}
