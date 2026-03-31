// lib/steam.ts

import type {
  GameConfig,
  SteamData,
  SteamRating,
  PlayerSnapshot,
} from "@/types";
import { getCached, setCached } from "./cache";

const STEAM_PLAYERS_API =
  "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1";
const STEAM_REVIEWS_API = "https://store.steampowered.com/appreviews";

const MAX_SNAPSHOTS = 168; // 7 days × 24 hours
const STEAM_TTL_MS = 25 * 60 * 60 * 1000; // 25 hours

export const STEAM_CACHE_KEY = (gameId: string) => `steam_${gameId}`;

type SteamPlayersResponse = {
  response?: {
    player_count?: number;
  };
};

type SteamReviewsResponse = {
  success?: number;
  query_summary?: {
    total_positive?: number;
    total_negative?: number;
    total_reviews?: number;
    review_score_desc?: string;
  };
};

async function fetchCurrentPlayers(appId: number): Promise<number> {
  const res = await fetch(`${STEAM_PLAYERS_API}?appid=${appId}&format=json`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Steam players API error: ${res.status}`);
  }

  const data = (await res.json()) as SteamPlayersResponse;
  const count = data?.response?.player_count;

  if (typeof count !== "number") {
    throw new Error("Unexpected Steam players API response");
  }

  return count;
}

async function fetchSteamRating(appId: number): Promise<SteamRating> {
  const url =
    `${STEAM_REVIEWS_API}/${appId}` +
    `?json=1&language=all&purchase_type=all&num_per_page=0`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Steam reviews API error: ${res.status}`);
  }

  const data = (await res.json()) as SteamReviewsResponse;
  const summary = data?.query_summary;

  const totalPositive = Number(summary?.total_positive ?? 0);
  const totalNegative = Number(summary?.total_negative ?? 0);
  const totalReviews = Number(
    summary?.total_reviews ?? totalPositive + totalNegative,
  );

  const denominator = totalPositive + totalNegative;
  const percent =
    denominator > 0
      ? Number(((totalPositive / denominator) * 100).toFixed(1))
      : null;

  return {
    percent,
    totalReviews,
    totalPositive,
    totalNegative,
    reviewScoreDesc: summary?.review_score_desc ?? null,
  };
}

export async function refreshSteamData(game: GameConfig): Promise<SteamData> {
  if (!game.steamAppId) {
    throw new Error(`${game.id} has no steamAppId`);
  }

  const existing = await getCached<SteamData>(STEAM_CACHE_KEY(game.id));
  const previousSnapshots: PlayerSnapshot[] = existing?.snapshots ?? [];

  const [playersResult, ratingResult] = await Promise.allSettled([
    fetchCurrentPlayers(game.steamAppId),
    fetchSteamRating(game.steamAppId),
  ]);

  if (playersResult.status !== "fulfilled") {
    throw playersResult.reason;
  }

  const currentPlayers = playersResult.value;
  const rating =
    ratingResult.status === "fulfilled"
      ? ratingResult.value
      : (existing?.rating ?? null);

  const now = new Date().toISOString();

  const snapshots = [...previousSnapshots, { t: now, p: currentPlayers }];

  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  }

  const peakPlayers7d =
    snapshots.length > 0
      ? Math.max(...snapshots.map((s) => s.p))
      : currentPlayers;

  const steamData: SteamData = {
    gameId: game.id,
    steamAppId: game.steamAppId,
    currentPlayers,
    peakPlayers7d,
    snapshots,
    rating,
    updatedAt: now,
  };

  await setCached(STEAM_CACHE_KEY(game.id), steamData, STEAM_TTL_MS);

  return steamData;
}
