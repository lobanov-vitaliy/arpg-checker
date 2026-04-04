// Re-export async game accessors. Data lives in MongoDB (seeded from src/data/games/*.json).
export { getGames, getGame } from "@/lib/games-db";
