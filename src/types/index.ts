// ─── Game Registry Types ─────────────────────────────────────────────────────

export type SeasonType = "season" | "ladder" | "cycle" | "league" | "expedition";

export interface GameConfig {
  id: string;
  name: string;
  shortName: string;
  developer: string;
  seasonType: SeasonType;
  accentColor: string;      // Tailwind text color: "text-red-400"
  bgGradient: string;       // Tailwind gradient: "from-red-950/90 via-gray-900 to-gray-950"
  accentBg: string;         // Tailwind bg color: "bg-red-400"
  glowColor: string;        // Hex color for decorative glow: "#ef4444"
  coverImage: string;       // Image URL for card header
  officialUrl: string;
  searchHints: string[];    // Generic search queries (NO hardcoded years or season numbers)
  popularityScore: number;  // 0–100 based on community size / Twitch / Steam charts
  steamAppId?: number;      // Steam App ID for live player count (omit if not on Steam)
}

// ─── Steam Types ──────────────────────────────────────────────────────────────

export interface PlayerSnapshot {
  t: string;   // ISO timestamp
  p: number;   // player count
}

export interface SteamData {
  gameId: string;
  steamAppId: number;
  currentPlayers: number;
  peakPlayers7d: number;
  snapshots: PlayerSnapshot[]; // last 168 entries (7 days × 24h)
  updatedAt: string;
}

// ─── Season Data Types ────────────────────────────────────────────────────────

export type SeasonStatus = "active" | "upcoming" | "ended" | "unknown";

export interface SeasonData {
  gameId: string;
  seasonName: string;
  seasonNumber?: number;
  status: SeasonStatus;
  startDate: string | null;
  endDate: string | null;
  nextSeasonStartDate?: string | null;
  nextSeasonIsEstimated?: boolean;
  avgSeasonDurationDays?: number | null;
  description?: string;
  sourceUrl?: string;
  confidence: "high" | "medium" | "low";
  fetchedAt: string;
  error?: string;
}

// ─── News Types ───────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
  gameId?: string;
  gameName?: string;
  source: string;
  tags: string[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SeasonsApiResponse {
  seasons: SeasonData[];
  cachedAt: string;
  nextRefresh: string;
}

export interface NewsApiResponse {
  articles: NewsArticle[];
  cachedAt: string;
  nextRefresh: string;
}
