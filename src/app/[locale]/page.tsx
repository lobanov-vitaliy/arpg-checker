import { getTranslations } from "next-intl/server";
import { GAMES } from "@/config/games";
import { GameGrid } from "@/components/dashboard/GameGrid";
import { getAllSeasons } from "@/lib/seasons";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const seasons = getAllSeasons();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400 text-sm">{t("subtitle")}</p>
      </div>
      <GameGrid games={GAMES} seasons={seasons} />
    </main>
  );
}
