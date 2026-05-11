import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExternalLink, CalendarDays, Timer } from "lucide-react";
import { getGame, getGames } from "@/config/games";
import { getSeasonsForGame } from "@/lib/seasons";
import { getSteamData } from "@/lib/steam-fetcher";
import { getGameNews } from "@/lib/steam-news";
import { NewsCard } from "@/components/news/NewsCard";
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
import { FormattedDate } from "@/components/FormattedDate";
import { toIntlLocale } from "@/lib/utils";
import {
  buildAlternates,
  toOgLocale,
  truncateTitle,
  clampDescription,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import { getLikesCount } from "@/lib/likes";
import type { GameConfig, SeasonData, SteamRating } from "@/types";

export const dynamic = "force-dynamic";

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

  // Steam-card-sized cover (460x215) is below Facebook's OG recommendation
  // (1200x630). Twitter renders it fine as a small card — use "summary" to
  // avoid social previews that stretch the cover.
  const twitterCard = "summary";

  // SEO-optimised title patterns — the layout template appends "| SeasonPulse",
  // so we cap the dynamic part so the whole SERP title stays ≤60 chars.
  let title: string;
  if (active?.status === "active" && active.endDate) {
    title = `When Does ${game.name} ${capitalise(active.seasonName ?? game.seasonType)} End?`;
  } else if (active?.status === "upcoming" || active?.nextSeasonStartDate) {
    title = `${game.name} Season Countdown – Next ${capitalise(game.seasonType)} Date`;
  } else {
    title = `${game.name} Season Tracker – Current ${capitalise(game.seasonType)} Dates`;
  }
  title = truncateTitle(title);

  const parts: string[] = [];
  parts.push(
    `Track the current and next ${game.name} ${game.seasonType}, countdowns, start and end dates.`,
  );
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
    parts.push(
      active.confidence === "high"
        ? "Dates are officially confirmed."
        : "Some dates are estimated.",
    );
  }
  const description = clampDescription(parts.join(" "));

  const pageUrl = `${SITE_URL}/${locale}/game/${gameId}`;

  return {
    title,
    description,
    alternates: buildAlternates(locale, `/game/${gameId}`),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: pageUrl,
      locale: toOgLocale(locale),
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
      card: twitterCard,
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

  const [steamData, likesCount, allSeasons, allGames, news] = await Promise.all([
    game.steamAppId ? getSteamData(game.id) : Promise.resolve(null),
    getLikesCount(game.id),
    getSeasonsForGame(game.id),
    getGames(),
    getGameNews(game, 3),
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
      {/* JSON-LD: BreadcrumbList + Event(s) + VideoGame + FAQPage */}
      <JsonLd
        game={{
          name: game.name,
          developer: game.developer,
          officialUrl: game.officialUrl,
          genres: game.genres,
        }}
        activeSeason={activeSeason ?? null}
        seasons={allSeasons}
        steamRating={steamData?.rating ?? null}
        coverImage={game.coverImage}
        locale={locale}
        gameId={gameId}
      />

      {/* Visible breadcrumb — mirrors the BreadcrumbList JSON-LD above. */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-6xl mx-auto px-4 pt-4 text-xs text-gray-500"
      >
        <ol className="flex items-center gap-1.5">
          <li>
            <a
              href={`/${locale}`}
              className="hover:text-gray-300 transition-colors"
            >
              {SITE_NAME}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-400" aria-current="page">
            {game.name}
          </li>
        </ol>
      </nav>

      {/* ── Compact header ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex flex-col gap-3">
        <div className="flex items-start gap-3 sm:gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-14 sm:w-48 sm:h-20 rounded-lg overflow-hidden shrink-0 border"
            style={{ borderColor: `${game.glowColor}40` }}
          >
            <GameImage
              src={game.coverImage}
              alt={game.name}
              glowColor={game.glowColor}
              priority
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
              {game.developer}
            </p>
            <h1
              className="text-xl sm:text-2xl font-bold break-words"
              style={{ color: game.glowColor }}
            >
              {game.name}
            </h1>
            {seoHeadline && (
              <p className="hidden sm:block text-sm text-gray-400 mt-0.5">
                {seoHeadline}
              </p>
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
        </div>

        {seoHeadline && (
          <p className="sm:hidden text-sm text-gray-400">{seoHeadline}</p>
        )}

        {/* Actions — wraps onto its own row on mobile */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
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
            aria-label="Countdown"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <Timer className="size-4" />
          </a>
          <a
            href={`/${locale}/calendar?game=${game.id}`}
            aria-label="Calendar"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <CalendarDays className="size-4" />
          </a>
          <div className="bg-white/15 w-px h-4" />
          <LikeButton
            gameId={game.id}
            initialCount={likesCount}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
          />
          <a
            href={game.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">{t("officialSite")}</span>
          </a>
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
            className="rounded-xl p-4 sm:p-5 flex flex-col gap-4 backdrop-blur-md"
            style={{
              backgroundColor: `${game.glowColor}08`,
              border: `1px solid ${game.glowColor}30`,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {seasonLabel}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-white break-words">
                  {activeSeason.seasonName}
                  {activeSeason.seasonNumber && (
                    <span className="text-gray-400 font-normal ml-2 text-base">
                      #{activeSeason.seasonNumber}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSeason.startDate && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                    {t("started")}
                  </p>
                  <p className="text-gray-200 text-sm">
                    <FormattedDate
                      iso={activeSeason.startDate}
                      locale={locale}
                      showTime
                    />
                  </p>
                </div>
              )}
              {activeSeason.endDate && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                    {t("ends")}
                  </p>
                  <p className="text-gray-200 text-sm">
                    <FormattedDate
                      iso={activeSeason.endDate}
                      locale={locale}
                      showTime
                    />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Latest news */}
        {news.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t("latestNews")}</h2>
              <a
                href={`/${locale}/news`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t("allNews")} →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((n) => (
                <NewsCard
                  key={n.id}
                  item={n}
                  locale={locale}
                  glowColor={game.glowColor}
                />
              ))}
            </div>
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
  seasons,
  steamRating,
  coverImage,
  locale,
  gameId,
}: {
  game: { name: string; developer: string; officialUrl: string; genres: string[] };
  activeSeason: SeasonData | null;
  seasons: SeasonData[];
  steamRating: SteamRating | null | undefined;
  coverImage: string;
  locale: string;
  gameId: string;
}) {
  const pageUrl = `${SITE_URL}/${locale}/game/${gameId}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: game.name, item: pageUrl },
    ],
  };

  const organizer = {
    "@type": "Organization",
    name: game.developer,
    url: game.officialUrl,
  };
  const location = { "@type": "VirtualLocation", url: game.officialUrl };

  const activeEvent =
    activeSeason?.startDate
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: `${game.name} – ${activeSeason.seasonName}`,
          startDate: activeSeason.startDate,
          ...(activeSeason.endDate ? { endDate: activeSeason.endDate } : {}),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location,
          organizer,
        }
      : null;

  // Upcoming / next-season Event: only emit when we have an officially-announced
  // start date (not an estimate) that's distinct from the active season.
  const nextSeasonEvent =
    activeSeason?.nextSeasonStartDate &&
    !activeSeason.nextSeasonIsEstimated &&
    activeSeason.nextSeasonStartDate !== activeSeason.startDate
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: `${game.name} – Next ${activeSeason.seasonName ?? "Season"}`,
          startDate: activeSeason.nextSeasonStartDate,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location,
          organizer,
        }
      : null;

  const aggregateRating =
    steamRating && steamRating.percent != null && steamRating.totalReviews > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (steamRating.percent / 20).toFixed(1),
          bestRating: 5,
          worstRating: 1,
          ratingCount: steamRating.totalReviews,
        }
      : null;

  const videoGame: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    url: pageUrl,
    image: coverImage,
    publisher: organizer,
    genre: game.genres,
    applicationCategory: "Game",
    operatingSystem: "Windows, macOS, Linux, PlayStation, Xbox",
  };
  if (aggregateRating) videoGame.aggregateRating = aggregateRating;

  // Short FAQ mirrors the component in GameFAQ so Google can surface it even
  // before the client FAQ hydrates.
  const faqEntries = buildFaqJsonLd(game.name, activeSeason, seasons);
  const faqPage =
    faqEntries.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries,
        }
      : null;

  const blocks = [breadcrumb, activeEvent, nextSeasonEvent, videoGame, faqPage].filter(
    (b): b is NonNullable<typeof b> => b !== null,
  );

  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

function buildFaqJsonLd(
  gameName: string,
  active: SeasonData | null,
  all: SeasonData[],
): Array<{ "@type": "Question"; name: string; acceptedAnswer: { "@type": "Answer"; text: string } }> {
  const qs: Array<{ q: string; a: string }> = [];
  if (active?.seasonName) {
    qs.push({
      q: `What is the current ${gameName} season?`,
      a: `The current ${gameName} season is ${active.seasonName}${
        active.seasonNumber ? ` (#${active.seasonNumber})` : ""
      }.`,
    });
  }
  if (active?.endDate) {
    const d = new Date(active.endDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    qs.push({
      q: `When does the current ${gameName} season end?`,
      a: `The current ${gameName} season ends on ${d}.`,
    });
  }
  if (active?.nextSeasonStartDate) {
    const d = new Date(active.nextSeasonStartDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const prefix = active.nextSeasonIsEstimated ? "is estimated to start" : "starts";
    qs.push({
      q: `When does the next ${gameName} season start?`,
      a: `The next ${gameName} season ${prefix} on ${d}.`,
    });
  }
  const completed = all.filter((s) => s.status === "ended" && s.startDate && s.endDate);
  if (completed.length > 0) {
    const avg = Math.round(
      completed.reduce(
        (sum, s) =>
          sum +
          (new Date(s.endDate!).getTime() - new Date(s.startDate!).getTime()) /
            (1000 * 60 * 60 * 24),
        0,
      ) / completed.length,
    );
    qs.push({
      q: `How long does a ${gameName} season last?`,
      a: `Recent ${gameName} seasons have lasted about ${avg} days on average.`,
    });
  }
  return qs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  }));
}
