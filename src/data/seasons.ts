/**
 * Game season types and data.
 * Game config + season data lives in src/data/games/*.json
 * Add a new game: create the JSON file and register it in src/data/index.ts.
 */

// Re-export types so existing imports keep working.
export type { ManualSeasonEntry, GameSeasons } from "@/types";

// Re-export data from the central loader.
export { GAME_SEASONS } from "@/data";
