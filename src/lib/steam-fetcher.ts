import type { GameConfig, SteamData, PlayerSnapshot } from "@/types";
import { getCached, setCached } from "./cache";

const STEAM_API = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1";
const MAX_SNAPSHOTS = 168; // 7 days × 24 hours
const STEAM_TTL_MS = 60 * 60 * 1000; // 1 hour

export const STEAM_CACHE_KEY = (gameId: string) => `steam_${gameId}`;

async function fetchCurrentPlayers(appId: number): Promise<number> {
  const res = await fetch(`${STEAM_API}?appid=${appId}&format=json`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  const count = data?.response?.player_count;
  if (typeof count !== "number") throw new Error("Unexpected Steam API response");
  return count;
}

export async function refreshSteamData(game: GameConfig): Promise<SteamData> {
  if (!game.steamAppId) throw new Error(`${game.id} has no steamAppId`);

  const currentPlayers = await fetchCurrentPlayers(game.steamAppId);
  const now = new Date().toISOString();

  // Load existing data to append snapshot
  const existing = await getCached<SteamData>(STEAM_CACHE_KEY(game.id));
  const snapshots: PlayerSnapshot[] = existing?.snapshots ?? [];

  // Append new snapshot and keep last MAX_SNAPSHOTS
  snapshots.push({ t: now, p: currentPlayers });
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  }

  const peakPlayers7d = Math.max(...snapshots.map((s) => s.p));

  const steamData: SteamData = {
    gameId: game.id,
    steamAppId: game.steamAppId,
    currentPlayers,
    peakPlayers7d,
    snapshots,
    updatedAt: now,
  };

  await setCached(STEAM_CACHE_KEY(game.id), steamData, STEAM_TTL_MS);
  return steamData;
}
