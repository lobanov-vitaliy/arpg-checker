// ─── Season Entry Types (used by game JSON files) ────────────────────────────

export interface ManualSeasonEntry {
  seasonName: string;
  seasonNumber?: number;
  // ISO 8601. Either date-only ("2026-03-20") or full UTC timestamp
  // ("2026-03-20T18:00:00Z") when the exact start time is known.
  startDate: string;
  endDate: string | null;
  // Only if officially announced; same format rules as startDate/endDate.
  nextSeasonStartDate?: string;
  description?: string;
  sourceUrl?: string;
  confidence: "high" | "medium" | "low";
}

export interface GameSeasons {
  gameId: string;
  seasons: ManualSeasonEntry[]; // newest first
}

// ─── Game Registry Types ─────────────────────────────────────────────────────

export interface SocialLinks {
  twitter?: string;  // X / Twitter
  discord?: string;
  reddit?: string;
  youtube?: string;
  twitch?: string;
}

export type SeasonType =
  | "season"
  | "ladder"
  | "cycle"
  | "league"
  | "expedition"
  | "nightwave";

export interface GameConfig {
  id: string;
  name: string;
  shortName: string;
  developer: string;
  seasonType: SeasonType;
  genres: string[]; // e.g. ["ARPG", "Hack & Slash"]
  accentColor: string; // Tailwind text color: "text-red-400"
  bgGradient: string; // Tailwind gradient: "from-red-950/90 via-gray-900 to-gray-950"
  accentBg: string; // Tailwind bg color: "bg-red-400"
  glowColor: string; // Hex color for decorative glow: "#ef4444"
  coverImage: string; // Image URL for card header
  officialUrl: string;
  socialLinks?: SocialLinks;
  searchHints: string[]; // Generic search queries (NO hardcoded years or season numbers)
  popularityScore: number; // 0–100 based on community size / Twitch / Steam charts
  steamAppId?: number; // Steam App ID for live player count (omit if not on Steam)
}

// ─── Steam Types ──────────────────────────────────────────────────────────────

// types/steam.ts

export type SteamRating = {
  percent: number | null;
  totalReviews: number;
  totalPositive: number;
  totalNegative: number;
  reviewScoreDesc: string | null;
};

export type PlayerSnapshot = {
  t: string;
  p: number;
};

export type SteamData = {
  gameId: string;
  steamAppId: number;
  currentPlayers: number;
  peakPlayers7d: number;
  snapshots?: PlayerSnapshot[];
  rating: SteamRating | null;
  updatedAt: string;
};

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

// ─── Dashboard Card Data ──────────────────────────────────────────────────────

export type GameFullData = {
  seasons: SeasonData[];
  likes: number;
  steam: SteamData | null;
};

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SeasonsApiResponse {
  seasons: SeasonData[];
  cachedAt: string;
  nextRefresh: string;
}
