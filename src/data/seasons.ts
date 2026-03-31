/**
 * Season data types. Game data (config + seasons) lives in src/data/games/*.json.
 * Add a new game: create the JSON file and register it in src/data/index.ts.
 */

export interface ManualSeasonEntry {
  seasonName: string;
  seasonNumber?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  nextSeasonStartDate?: string; // YYYY-MM-DD — only if officially announced
  description?: string;
  sourceUrl?: string;
  confidence: "high" | "medium" | "low";
}

export interface GameSeasons {
  gameId: string;
  seasons: ManualSeasonEntry[]; // newest first
}

// Re-export from central loader so existing imports keep working.
export { GAME_SEASONS } from "@/data";
