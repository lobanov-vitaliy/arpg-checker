import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExternalLink, CalendarDays, Timer } from "lucide-react";
import { getGame, getGames } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { getSteamData } from "@/lib/steam-fetcher";
import { GameImage } from "@/components/dashboard/GameImage";
import { SeasonBadge } from "@/components/dashboard/SeasonBadge";
import { ConfidenceBadge } from "@/components/game/ConfidenceBadge";
import { TrustMeta } from "@/components/game/TrustMeta";
import { GameFAQ } from "@/components/game/GameFAQ";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { ElapsedTimer } from "@/components/dashboard/ElapsedTimer";
import { SteamReviewBadge } from "@/components/dashboard/SteamReviewBadge";
import { SeasonProgressBar } from "@/components/game/SeasonProgressBar";
import { PlayerChartFull } from "@/components/game/PlayerChartFull";
import { SeasonsHistory } from "@/components/game/SeasonsHistory";
import { SocialLinks } from "@/components/game/SocialLinks";
import { LikeButton } from "@/components/dashboard/LikeButton";
import { toIntlLocale } from "@/lib/utils";
import { getLikesCount } from "@/lib/likes";
import type { GameConfig, SeasonData } from "@/types";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";

const OG_MAP: Record<string, string> = {
  en: "en_US",
  ua: "uk_UA",
  es: "es_ES",
  pl: "pl_PL",
  de: "de_DE",
  fr: "fr_FR",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; gameId: string }>;
}): Promise<Metadata> {
  const { locale, gameId } = await params;
  const game = await getGame(gameId);
  if (!game) return {};

  const seasons = await getSeasonsForGame(game.id);
  const active =
    seasons.find((s) => s.status === "active") ??
    seasons.find((s) => s.status === "upcoming") ??
    seasons[0];

  const ogLocale = OG_MAP[locale] ?? "en_US";

  // SEO-optimised title patterns
  let title: string;
  if (active?.status === "active" && active.endDate) {
    title = `When Does ${game.name} ${capitalise(active.seasonName ?? game.seasonType)} End? | Season Pulse`;
  } else if (active?.status === "upcoming" || active?.nextSeasonStartDate) {
    title = `${game.name} Season Countdown – Next ${capitalise(game.seasonType)} Date | Season Pulse`;
  } else {
    title = `${game.name} Season Tracker – Current ${capitalise(game.seasonType)} and Dates | Season Pulse`;
  }

  // SEO description
  const parts: string[] = [];
  parts.push(`Track the current and next ${game.name} ${game.seasonType}, countdowns, start and end dates.`);
  if (active) {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(toIntlLocale(locale), {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    if (active.endDate) parts.push(`Current ${game.seasonType} ends ${fmt(active.endDate)}.`);
    if (active.nextSeasonStartDate) {
      const label = active.nextSeasonIsEstimated ? "Next estimated" : "Next";
      parts.push(`${label} ${game.seasonType} starts ${fmt(active.nextSeasonStartDate)}.`);
    }
    const confidenceLabel = active.confidence === "high" ? "Dates are officially confirmed." : "Some dates are estimated.";
    parts.push(confidenceLabel);
  }
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
        es: `${SITE_URL}/es/game/${gameId}`,
        pl: `${SITE_URL}/pl/game/${gameId}`,
        de: `${SITE_URL}/de/game/${gameId}`,
        fr: `${SITE_URL}/fr/game/${gameId}`,
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
  const game = await getGame(gameId);
  if (!game) notFound();

  const t = await getTranslations("game");

  const [steamData, likesCount, allSeasons, allGames] = await Promise.all([
    game.steamAppId ? getSteamData(game.id) : Promise.resolve(null),
    getLikesCount(game.id),
    getSeasonsForGame(game.id),
    getGames(),
  ]);

  const activeSeason =
    allSeasons.find((s) => s.status === "active") ??
    allSeasons.find((s) => s.status === "upcoming") ??
    allSeasons[0];

  const startDate = activeSeason?.startDate ? new Date(activeSeason.startDate) : null;
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
              (new Date(s.endDate!).getTime() - new Date(s.startDate!).getTime()) /
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

  // SEO H2 text based on available data
  const seoHeadline = buildSeoHeadline(game.name, game.seasonType, activeSeason ?? null);

  // Other games from the same genre (up to 3, excluding current)
  const relatedGames = await Promise.all(
    allGames
      .filter(
        (g) => g.id !== game.id && g.genres.some((genre) => game.genres.includes(genre)),
      )
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 3)
      .map(async (g) => {
        const seasons = await getSeasonsForGame(g.id);
        const season =
          seasons.find((s) => s.status === "active") ??
          seasons.find((s) => s.status === "upcoming");
        return { game: g, season };
      }),
  );
  const filteredRelatedGames = relatedGames.filter(
    (r): r is { game: GameConfig; season: SeasonData } => r.season !== undefined,
  );

  return (
    <main className="min-h-screen">
      {/* JSON-LD: BreadcrumbList + Event */}
      <JsonLd game={{ name: game.name, developer: game.developer, officialUrl: game.officialUrl }} activeSeason={activeSeason ?? null} locale={locale} gameId={gameId} />

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
            {seoHeadline && (
              <p className="text-sm text-gray-400 mt-0.5">{seoHeadline}</p>
            )}
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
            {game.socialLinks && (
              <>
                <SocialLinks
                  socialLinks={game.socialLinks}
                  glowColor={game.glowColor}
                  gameId={game.id}
                />
                <div className="bg-white/15 w-px h-4" />
              </>
            )}
            <a
              href={`/${locale}/countdown/${game.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <Timer className="size-4" />
            </a>
            <a
              href={`/${locale}/calendar?game=${game.id}`}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <CalendarDays className="size-4" />
            </a>
            <div className="bg-white/15 w-px h-4" />
            <LikeButton gameId={game.id} initialCount={likesCount} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg" />
            <a
              href={game.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
            >
              <ExternalLink className="size-4" />
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
            {
              label: t("totalSeasons"),
              value: String(allSeasons.filter((s) => s.status !== "upcoming").length),
            },
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
              className="rounded-lg px-4 py-3 bg-white/3 border border-white/8 backdrop-blur-md"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Current season card */}
        {activeSeason && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4 backdrop-blur-md"
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
              <div className="flex items-center gap-2 shrink-0">
                <ConfidenceBadge confidence={activeSeason.confidence} />
                <SeasonBadge status={activeSeason.status} />
              </div>
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
                      { month: "long", day: "numeric", year: "numeric" },
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
                      { month: "long", day: "numeric", year: "numeric" },
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

            <TrustMeta fetchedAt={activeSeason.fetchedAt} sourceUrl={activeSeason.sourceUrl} />
          </div>
        )}

        {/* Steam chart */}
        {game.steamAppId && (
          <div className="rounded-xl p-5 bg-white/3 border border-white/8 backdrop-blur-md">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {t("playersOnline")}
            </h2>
            {steamData && steamData.snapshots && steamData.snapshots.length > 0 ? (
              <PlayerChartFull
                steam={steamData}
                glowColor={game.glowColor}
                seasonStart={activeSeason?.startDate}
                seasonEnd={activeSeason?.endDate}
                seasonLabel={t("currentSeason", { seasonType: game.seasonType })}
              />
            ) : (
              <p className="text-xs text-yellow-500/70">{t("dataStale")}</p>
            )}
          </div>
        )}

        {/* FAQ */}
        <GameFAQ
          gameName={game.name}
          seasonType={game.seasonType}
          activeSeason={activeSeason ?? null}
          locale={locale}
        />

        {/* Other game timers — same genre, up to 3 */}
        {filteredRelatedGames.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">{t("otherTimers")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRelatedGames.map(({ game: rg, season: rs }) => {
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
                    className="rounded-xl p-4 flex flex-col gap-3 hover:brightness-110 transition-all backdrop-blur-md"
                    style={{
                      backgroundColor: `${rg.glowColor}08`,
                      border: `1px solid ${rg.glowColor}25`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-7 rounded overflow-hidden shrink-0"
                        style={{ border: `1px solid ${rg.glowColor}40` }}
                      >
                        <GameImage src={rg.coverImage} alt={rg.name} glowColor={rg.glowColor} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: rg.glowColor }}>
                          {rg.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{rs.seasonName}</p>
                      </div>
                    </div>

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
                        label={rsNext ? t("nextSeasonIn", { seasonType: rg.seasonType }) : t("endsIn")}
                        accentColor={rg.accentColor}
                        isEstimated={rsNext ? (rs.nextSeasonIsEstimated ?? true) : false}
                      />
                    ) : rsStart ? (
                      <ElapsedTimer startDate={rsStart} label={t("runningFor")} />
                    ) : null}
                  </a>
                );
              })}
            </div>
            <div className="mt-3 text-right">
              <a
                href={`/${locale}`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t("browseAll")} →
              </a>
            </div>
          </div>
        )}

        {/* Steam widget */}
        {game.steamAppId && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">{t("steamStore")}</h2>
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildSeoHeadline(
  gameName: string,
  seasonType: string,
  activeSeason: SeasonData | null,
): string | null {
  if (!activeSeason) return null;
  if (activeSeason.status === "active" && activeSeason.endDate) {
    return `When does the current ${gameName} ${seasonType} end?`;
  }
  if (activeSeason.status === "upcoming") {
    return `When does the next ${gameName} ${seasonType} start?`;
  }
  if (activeSeason.nextSeasonStartDate) {
    return `${gameName} ${seasonType} countdown — current and next dates`;
  }
  return null;
}

// Inline JSON-LD component (server-only)
function JsonLd({
  game,
  activeSeason,
  locale,
  gameId,
}: {
  game: { name: string; developer: string; officialUrl: string };
  activeSeason: SeasonData | null;
  locale: string;
  gameId: string;
}) {
  const pageUrl = `${SITE_URL}/${locale}/game/${gameId}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Season Pulse", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: game.name, item: pageUrl },
    ],
  };

  const event =
    activeSeason?.startDate
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: `${game.name} – ${activeSeason.seasonName}`,
          startDate: activeSeason.startDate,
          ...(activeSeason.endDate ? { endDate: activeSeason.endDate } : {}),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: { "@type": "VirtualLocation", url: game.officialUrl },
          organizer: { "@type": "Organization", name: game.developer, url: game.officialUrl },
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }}
        />
      )}
    </>
  );
}
