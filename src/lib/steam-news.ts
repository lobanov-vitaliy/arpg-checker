import type { GameConfig } from "@/types";
import { getCached, setCached } from "./cache";

// Steam News API — free, no key required.
// Docs: https://partner.steamgames.com/doc/webapi/ISteamNews
const STEAM_NEWS_API = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2";
const NEWS_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface SteamNewsItem {
  gid: string;
  title: string;
  url: string;
  feedlabel: string;
  feedname: string;
  // Unix seconds
  date: number;
  contents: string;
  author?: string;
  tags?: string[];
}

interface SteamNewsResponse {
  appnews?: {
    newsitems?: SteamNewsItem[];
  };
}

// Fetch up to `count` recent news items, looking back `lookbackDays` days.
async function fetchSteamNews(
  appId: number,
  lookbackDays: number,
  count: number
): Promise<SteamNewsItem[]> {
  const url = new URL(STEAM_NEWS_API);
  url.searchParams.set("appid", String(appId));
  url.searchParams.set("count", String(count));
  url.searchParams.set("maxlength", "1500");
  url.searchParams.set(
    "enddate",
    String(Math.floor(Date.now() / 1000))
  );

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Steam News HTTP ${res.status}`);
  const json = (await res.json()) as SteamNewsResponse;
  const items = json.appnews?.newsitems ?? [];

  const cutoff = Math.floor((Date.now() - lookbackDays * 86_400_000) / 1000);
  return items.filter((n) => n.date >= cutoff);
}

// Heuristic: "official" feed = developer-run announcements, not third-party reblogs.
const OFFICIAL_FEEDNAMES = new Set([
  "steam_community_announcements",
  "community",
]);

function isOfficialFeed(item: SteamNewsItem): boolean {
  if (OFFICIAL_FEEDNAMES.has(item.feedname)) return true;
  // Some games use a custom feed labelled with the studio name.
  const label = (item.feedlabel ?? "").toLowerCase();
  return (
    label.includes("official") ||
    label.includes("announcement") ||
    label.includes("blog")
  );
}

// Tokens that strongly suggest a season/league/cycle announcement.
const SEASON_KEYWORDS_BASE = [
  "season",
  "league",
  "cycle",
  "ladder",
  "expedition",
  "nightwave",
  "act ",
  "chapter",
  "episode",
];

function buildKeywords(game: GameConfig): string[] {
  const set = new Set<string>(SEASON_KEYWORDS_BASE);
  set.add(game.seasonType.toLowerCase());
  return [...set];
}

function scoreItem(item: SteamNewsItem, keywords: string[]): number {
  const haystack = `${item.title}\n${item.contents}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += 1;
  }
  // Title matches weigh more.
  const titleLower = item.title.toLowerCase();
  for (const kw of keywords) {
    if (titleLower.includes(kw)) score += 2;
  }
  // Bonus for official source.
  if (isOfficialFeed(item)) score += 2;
  // Bonus for explicit "release" / "begins" / "starts" / "launch" verbs near a date.
  if (/\b(release|begins|starts|launch|live now|coming|arrives)\b/i.test(haystack)) {
    score += 1;
  }
  // Bonus for an ISO-ish date or month name in the title.
  if (
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b/i.test(item.title) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(item.title)
  ) {
    score += 1;
  }
  return score;
}

export interface SteamNewsCandidate {
  item: SteamNewsItem;
  score: number;
  publishedAt: string;
}

// ─── Public news (cached) ────────────────────────────────────────────────────

export interface GameNewsItem {
  id: string;
  title: string;
  url: string;
  // Short plain-text excerpt (BBCode/HTML stripped).
  excerpt: string;
  // ISO 8601.
  publishedAt: string;
  feedLabel: string;
  feedName: string;
  author: string | null;
}

const officialNewsCacheKey = (gameId: string) => `news_${gameId}`;

// Strip Steam's mix of BBCode and HTML down to a short plain-text excerpt.
function stripFormatting(raw: string): string {
  return raw
    // BBCode tags like [img], [url=...], [list], [/h1]
    .replace(/\[\/?[a-z][^\]]*\]/gi, " ")
    // HTML tags
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    // HTML entities (rough but enough for excerpts)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(raw: string, max = 220): string {
  const text = stripFormatting(raw);
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  // Try to cut on a word boundary.
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max - 40 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function toGameNewsItem(item: SteamNewsItem): GameNewsItem {
  return {
    id: item.gid,
    title: item.title,
    url: item.url,
    excerpt: buildExcerpt(item.contents ?? ""),
    publishedAt: new Date(item.date * 1000).toISOString(),
    feedLabel: item.feedlabel ?? "",
    feedName: item.feedname ?? "",
    author: item.author && item.author.trim().length > 0 ? item.author : null,
  };
}

// Fetch + cache the latest official announcements for a single game.
// Cached per-game in Mongo for NEWS_TTL_MS so the dashboard and game pages
// hit Steam at most once an hour per app.
export async function getGameNews(
  game: Pick<GameConfig, "id" | "steamAppId">,
  limit = 5
): Promise<GameNewsItem[]> {
  if (!game.steamAppId) return [];

  const cacheKey = officialNewsCacheKey(game.id);
  const cached = await getCached<GameNewsItem[]>(cacheKey);
  if (cached) return cached.slice(0, limit);

  let items: SteamNewsItem[] = [];
  try {
    items = await fetchSteamNews(game.steamAppId, 365, 20);
  } catch (err) {
    console.warn(`[steam-news] ${game.id} fetch failed:`, err);
    return [];
  }

  const official = items
    .filter(isOfficialFeed)
    .sort((a, b) => b.date - a.date)
    .map(toGameNewsItem);

  await setCached(cacheKey, official, NEWS_TTL_MS);
  return official.slice(0, limit);
}

export interface MultiGameNewsItem extends GameNewsItem {
  gameId: string;
  gameName: string;
  glowColor: string;
  coverImage: string;
}

// Fetch news for many games in parallel and merge into a single timeline.
export async function getMultiGameNews(
  games: Array<Pick<GameConfig, "id" | "name" | "glowColor" | "coverImage" | "steamAppId">>,
  perGame = 5,
  totalLimit = 60
): Promise<MultiGameNewsItem[]> {
  const withSteam = games.filter((g) => g.steamAppId);
  const results = await Promise.all(
    withSteam.map(async (g) => {
      const news = await getGameNews(g, perGame);
      return news.map((n) => ({
        ...n,
        gameId: g.id,
        gameName: g.name,
        glowColor: g.glowColor,
        coverImage: g.coverImage,
      }));
    })
  );
  return results
    .flat()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, totalLimit);
}

// Returns relevant candidate news items (sorted by score desc).
// Empty array means "no fresh signal — skip LLM call".
export async function findSeasonCandidates(
  game: GameConfig,
  opts: { lookbackDays?: number; minScore?: number; max?: number } = {}
): Promise<SteamNewsCandidate[]> {
  if (!game.steamAppId) return [];
  const lookbackDays = opts.lookbackDays ?? 21;
  const minScore = opts.minScore ?? 3;
  const max = opts.max ?? 3;

  const items = await fetchSteamNews(game.steamAppId, lookbackDays, 30);
  const keywords = buildKeywords(game);
  const scored = items
    .map((item) => ({
      item,
      score: scoreItem(item, keywords),
      publishedAt: new Date(item.date * 1000).toISOString(),
    }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored;
}
