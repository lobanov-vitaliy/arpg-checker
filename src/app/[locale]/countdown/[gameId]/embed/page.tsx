import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getGame } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { CountdownEmbed } from "./CountdownEmbed";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ locale: string; gameId: string }>;
}) {
  const { locale, gameId } = await params;
  const game = await getGame(gameId);
  if (!game) notFound();

  const tCd = await getTranslations("countdown");
  const t = await getTranslations("countdownPage");

  const seasons = await getSeasonsForGame(game.id);
  const active = seasons.find((s) => s.status === "active");
  const upcoming = seasons.find((s) => s.status === "upcoming");

  let targetDate: string | null = null;
  let label = "";

  if (upcoming?.startDate) {
    targetDate = upcoming.startDate;
    label = t("nextSeason", { seasonType: game.seasonType });
  } else if (active?.endDate) {
    targetDate = active.endDate;
    label = t("seasonEnds", { seasonType: game.seasonType });
  } else if (active?.nextSeasonStartDate) {
    targetDate = active.nextSeasonStartDate;
    label = t("nextSeason", { seasonType: game.seasonType });
  }

  const seasonName = upcoming?.seasonName ?? active?.seasonName ?? "";

  return (
    <CountdownEmbed
      gameName={game.name}
      seasonName={seasonName}
      glowColor={game.glowColor}
      targetDate={targetDate}
      label={label}
      labels={{
        days: tCd("days"),
        hrs: tCd("hrs"),
        min: tCd("min"),
        sec: tCd("sec"),
        expired: tCd("expired"),
        poweredBy: t("poweredBy"),
      }}
    />
  );
}
