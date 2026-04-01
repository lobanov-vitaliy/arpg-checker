import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGame, GAMES } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { toIntlLocale } from "@/lib/utils";
import { CountdownFullscreen } from "./CountdownFullscreen";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";

export async function generateStaticParams() {
  return GAMES.map((g) => ({ gameId: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; gameId: string }>;
}): Promise<Metadata> {
  const { locale, gameId } = await params;
  const game = getGame(gameId);
  if (!game) return {};

  const seasons = getSeasonsForGame(game.id);
  const active =
    seasons.find((s) => s.status === "active") ??
    seasons.find((s) => s.status === "upcoming");

  const title = `${game.name} — Countdown Timer`;
  const description = active
    ? `Live countdown for ${game.name} ${game.seasonType}: ${active.seasonName}. Track start and end dates in real time.`
    : `${game.name} season countdown timer — track the next ${game.seasonType} start date.`;

  const pageUrl = `${SITE_URL}/${locale}/countdown/${gameId}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      images: game.coverImage ? [{ url: game.coverImage, width: 460, height: 215 }] : undefined,
    },
  };
}

export default async function CountdownPage({
  params,
}: {
  params: Promise<{ locale: string; gameId: string }>;
}) {
  const { locale, gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  const t = await getTranslations("countdownPage");
  const tCd = await getTranslations("countdown");

  const seasons = getSeasonsForGame(game.id);
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

  const pageUrl = `${SITE_URL}/${locale}/countdown/${gameId}`;
  const embedUrl = `${SITE_URL}/${locale}/countdown/${gameId}/embed`;

  return (
    <CountdownFullscreen
      gameName={game.name}
      gameId={game.id}
      seasonName={seasonName}
      glowColor={game.glowColor}
      coverImage={game.coverImage}
      targetDate={targetDate}
      label={label}
      locale={locale}
      pageUrl={pageUrl}
      embedUrl={embedUrl}
      labels={{
        noUpcoming: t("noUpcoming"),
        checkBack: t("checkBack"),
        copyLink: t("copyLink"),
        copied: t("copied"),
        share: t("share"),
        embed: t("embed"),
        embedCode: t("embedCode"),
        embedCopied: t("embedCopied"),
        back: t("back", { game: game.name }),
        poweredBy: t("poweredBy"),
        days: tCd("days"),
        hrs: tCd("hrs"),
        min: tCd("min"),
        sec: tCd("sec"),
        expired: tCd("expired"),
      }}
    />
  );
}
