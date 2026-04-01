import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExternalLink, CalendarDays, Timer } from "lucide-react";
import { getGame, GAMES } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { getCached } from "@/lib/cache";
import { STEAM_CACHE_KEY } from "@/lib/steam-fetcher";
import { GameImage } from "@/components/dashboard/GameImage";
import { SeasonBadge } from "@/components/dashboard/SeasonBadge";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { ElapsedTimer } from "@/components/dashboard/ElapsedTimer";
import { SteamReviewBadge } from "@/components/dashboard/SteamReviewBadge";
import { SeasonProgressBar } from "@/components/game/SeasonProgressBar";
import { PlayerChartFull } from "@/components/game/PlayerChartFull";
import { SeasonsHistory } from "@/components/game/SeasonsHistory";
import { toIntlLocale } from "@/lib/utils";
import type { SteamData } from "@/types";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";

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
    seasons.find((s) => s.status === "upcoming") ??
    seasons[0];

  const OG_MAP: Record<string, string> = {
    en: "en_US",
    ua: "uk_UA",
    es: "es_ES",
    pl: "pl_PL",
    de: "de_DE",
    fr: "fr_FR",
  };
  const ogLocale = OG_MAP[locale] ?? "en_US";

  // Build title: "Diablo IV — Season of Slaughter #12"
  const titleSuffix = active
    ? active.seasonNumber
      ? `${active.seasonName} #${active.seasonNumber}`
      : active.seasonName
    : game.seasonType;
  const title = `${game.name} — ${titleSuffix}`;

  // Build description with season status + dates
  const parts: string[] = [];
  if (active) {
    const statusMap = {
      active: "Active",
      upcoming: "Upcoming",
      ended: "Ended",
      unknown: "Unknown",
    };
    parts.push(
      `${statusMap[active.status]} ${game.seasonType}: ${active.seasonName}.`,
    );
    if (active.startDate) {
      const fmt = (d: string) =>
        new Date(d).toLocaleDateString(toIntlLocale(locale), {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      if (active.status === "upcoming") {
        parts.push(`Starts ${fmt(active.startDate)}.`);
      } else {
        parts.push(`Started ${fmt(active.startDate)}.`);
      }
      if (active.endDate) parts.push(`Ends ${fmt(active.endDate)}.`);
    }
    if (active.description) parts.push(active.description);
  }
  parts.push(
    `Track all ${game.name} ${game.seasonType}s, countdowns, and player stats on SeasonPulse.`,
  );
  const description = parts.join(" ");

  const pageUrl = `${SITE_URL}/${locale}/game/${gameId}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        en: `${SITE_URL}/en/game/${gameId}`,
        uk: `${SITE_URL}/ua/game/${gameId}`,
        ru: `${SITE_URL}/ru/game/${gameId}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      locale: ogLocale,
      images: [
        {
          url: game.coverImage,
          width: 460,
          height: 215,
          alt: `${game.name} cover`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [game.coverImage],
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; gameId: string }>;
}) {
  const { gameId, locale } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  const t = await getTranslations("game");

  const allSeasons = getSeasonsForGame(game.id);
  const steamData = game.steamAppId
    ? await getCached<SteamData>(STEAM_CACHE_KEY(game.id))
    : null;

  const activeSeason =
    allSeasons.find((s) => s.status === "active") ??
    allSeasons.find((s) => s.status === "upcoming") ??
    allSeasons[0];

  const startDate = activeSeason?.startDate
    ? new Date(activeSeason.startDate)
    : null;
  const endDate = activeSeason?.endDate ? new Date(activeSeason.endDate) : null;
  const nextDate =
    activeSeason?.nextSeasonStartDate &&
    new Date(activeSeason.nextSeasonStartDate).getTime() > Date.now()
      ? new Date(activeSeason.nextSeasonStartDate)
      : null;

  const completedSeasons = allSeasons.filter(
    (s) => s.status === "ended" && s.startDate && s.endDate,
  );
  const avgDuration =
    completedSeasons.length > 0
      ? Math.round(
          completedSeasons.reduce((sum, s) => {
            const days =
              (new Date(s.endDate!).getTime() -
                new Date(s.startDate!).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedSeasons.length,
        )
      : null;

  const seasonLabel =
    activeSeason?.status === "upcoming"
      ? t("upcomingSeason", { seasonType: game.seasonType })
      : activeSeason?.status === "ended"
        ? t("endedSeason", { seasonType: game.seasonType })
        : t("currentSeason", { seasonType: game.seasonType });

  // Other games from the same genre (up to 3, excluding current)
  const relatedGames = GAMES.filter(
    (g) =>
      g.id !== game.id && g.genres.some((genre) => game.genres.includes(genre)),
  )
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3)
    .map((g) => {
      const season =
        getSeasonsForGame(g.id).find((s) => s.status === "active") ??
        getSeasonsForGame(g.id).find((s) => s.status === "upcoming");
      return { game: g, season };
    })
    .filter((r) => r.season !== undefined) as {
    game: (typeof GAMES)[0];
    season: NonNullable<ReturnType<typeof getSeasonsForGame>[0]>;
  }[];

  return (
    <main className="min-h-screen">
      {/* ── Compact header ── */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="w-24 h-16 sm:w-48 sm:h-20 rounded-lg overflow-hidden shrink-0 border"
            style={{ borderColor: `${game.glowColor}40` }}
          >
            <GameImage
              src={game.coverImage}
              alt={game.name}
              glowColor={game.glowColor}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
              {game.developer}
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ color: game.glowColor }}
            >
              {game.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {game.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-400"
                >
                  {g}
                </span>
              ))}
              <SteamReviewBadge rating={steamData?.rating ?? null} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/${locale}/countdown/${game.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <Timer className="w-3.5 h-3.5" />
            </a>
            <a
              href={`/${locale}/calendar?game=${game.id}`}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </a>
            <a
              href={game.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("officialSite")}
            </a>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-8">
        {/* Quick stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("totalSeasons"), value: String(allSeasons.filter((s) => s.status !== "upcoming").length) },
            {
              label: t("avgDuration"),
              value: avgDuration ? `${avgDuration} ${t("days")}` : "—",
            },
            {
              label: "Steam online",
              value: steamData ? formatCount(steamData.currentPlayers) : "—",
            },
            {
              label: "7d peak",
              value: steamData ? formatCount(steamData.peakPlayers7d) : "—",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg px-4 py-3 bg-white/3 border border-white/8"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Current season card */}
        {activeSeason && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{
              backgroundColor: `${game.glowColor}08`,
              border: `1px solid ${game.glowColor}30`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {seasonLabel}
                </p>
                <h2 className="text-xl font-bold text-white">
                  {activeSeason.seasonName}
                  {activeSeason.seasonNumber && (
                    <span className="text-gray-400 font-normal ml-2 text-base">
                      #{activeSeason.seasonNumber}
                    </span>
                  )}
                </h2>
              </div>
              <SeasonBadge status={activeSeason.status} />
            </div>

            {activeSeason.description && (
              <p className="text-gray-400 text-sm leading-relaxed">
                {activeSeason.description}
              </p>
            )}

            {activeSeason.status === "active" && (
              <SeasonProgressBar
                season={activeSeason}
                glowColor={game.glowColor}
                label={t("seasonProgress")}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              {activeSeason.startDate && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                    {t("started")}
                  </p>
                  <p className="text-gray-200 text-sm">
                    {new Date(activeSeason.startDate).toLocaleDateString(
                      toIntlLocale(locale),
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}
              {activeSeason.endDate && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                    {t("ends")}
                  </p>
                  <p className="text-gray-200 text-sm">
                    {new Date(activeSeason.endDate).toLocaleDateString(
                      toIntlLocale(locale),
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}
            </div>

            {activeSeason.status === "upcoming" && startDate ? (
              <CountdownTimer
                targetDate={startDate}
                label={t("startsIn")}
                accentColor={game.accentColor}
                isEstimated={false}
              />
            ) : activeSeason.status === "active" ? (
              <div className="grid grid-cols-2 gap-3">
                {startDate && (
                  <ElapsedTimer startDate={startDate} label={t("runningFor")} />
                )}
                {nextDate ? (
                  <CountdownTimer
                    targetDate={nextDate}
                    label={t("nextSeasonIn", { seasonType: game.seasonType })}
                    accentColor={game.accentColor}
                    isEstimated={activeSeason.nextSeasonIsEstimated ?? true}
                  />
                ) : endDate ? (
                  <CountdownTimer
                    targetDate={endDate}
                    label={t("endsIn")}
                    accentColor={game.accentColor}
                    isEstimated={false}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {/* Steam chart */}
        {game.steamAppId && (
          <div className="rounded-xl p-5 bg-white/3 border border-white/8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {t("playersOnline")}
            </h2>
            {steamData && steamData.snapshots.length > 0 ? (
              <PlayerChartFull
                steam={steamData}
                glowColor={game.glowColor}
                seasonStart={activeSeason?.startDate}
                seasonEnd={activeSeason?.endDate}
                seasonLabel={t("currentSeason", {
                  seasonType: game.seasonType,
                })}
              />
            ) : (
              <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
            )}
          </div>
        )}

        {/* Other game timers — same genre, up to 3 */}
        {relatedGames.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {t("otherTimers")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedGames.map(({ game: rg, season: rs }) => {
                const rsStart = rs.startDate ? new Date(rs.startDate) : null;
                const rsEnd = rs.endDate ? new Date(rs.endDate) : null;
                const rsNext =
                  rs.nextSeasonStartDate &&
                  new Date(rs.nextSeasonStartDate).getTime() > Date.now()
                    ? new Date(rs.nextSeasonStartDate)
                    : null;

                return (
                  <a
                    key={rg.id}
                    href={`/${locale}/game/${rg.id}`}
                    className="rounded-xl p-4 flex flex-col gap-3 hover:brightness-110 transition-all"
                    style={{
                      backgroundColor: `${rg.glowColor}08`,
                      border: `1px solid ${rg.glowColor}25`,
                    }}
                  >
                    {/* Mini header */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-7 rounded overflow-hidden shrink-0"
                        style={{ border: `1px solid ${rg.glowColor}40` }}
                      >
                        <GameImage
                          src={rg.coverImage}
                          alt={rg.name}
                          glowColor={rg.glowColor}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: rg.glowColor }}
                        >
                          {rg.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {rs.seasonName}
                        </p>
                      </div>
                    </div>

                    {/* Timer */}
                    {rs.status === "upcoming" && rsStart ? (
                      <CountdownTimer
                        targetDate={rsStart}
                        label={t("startsIn")}
                        accentColor={rg.accentColor}
                        isEstimated={false}
                      />
                    ) : rs.status === "active" && (rsNext ?? rsEnd) ? (
                      <CountdownTimer
                        targetDate={(rsNext ?? rsEnd)!}
                        label={
                          rsNext
                            ? t("nextSeasonIn", { seasonType: rg.seasonType })
                            : t("endsIn")
                        }
                        accentColor={rg.accentColor}
                        isEstimated={
                          rsNext ? (rs.nextSeasonIsEstimated ?? true) : false
                        }
                      />
                    ) : rsStart ? (
                      <ElapsedTimer
                        startDate={rsStart}
                        label={t("runningFor")}
                      />
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Steam widget */}
        {game.steamAppId && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {t("steamStore")}
            </h2>
            {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
            <iframe
              src={`https://store.steampowered.com/widget/${game.steamAppId}?utm_source=seasonpulse&utm_content=steam_embed`}
              width="100%"
              height="190"
              className="w-full"
            />
          </div>
        )}

        {/* Season history */}
        <SeasonsHistory
          seasons={allSeasons}
          glowColor={game.glowColor}
          locale={locale}
          labels={{
            title: t("allSeasons"),
            started: t("started"),
            ends: t("ends"),
            duration: t("duration"),
            source: t("source"),
          }}
        />
      </div>
    </main>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
