import { getGameSeasons, getAllGameSeasons, getAllGameSeasonsForIds } from "./games-db";
import type { ManualSeasonEntry, SeasonData } from "@/types";

function computeStatus(startDate: string, endDate: string | null): SeasonData["status"] {
  const now = Date.now();
  if (new Date(startDate).getTime() > now) return "upcoming";
  if (endDate && new Date(endDate).getTime() < now) return "ended";
  return "active";
}

function computeAvgDuration(entries: ManualSeasonEntry[]): number | null {
  const completed = entries
    .filter((e) => e.endDate !== null)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 4);
  if (completed.length === 0) return null;
  const durations = completed.map((e) =>
    (new Date(e.endDate!).getTime() - new Date(e.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

function estimateNextStart(startDate: string, avgDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + avgDays);
  return d.toISOString().split("T")[0];
}

function toSeasonData(
  gameId: string,
  entry: ManualSeasonEntry,
  allEntries: ManualSeasonEntry[],
  avgDays: number | null
): SeasonData {
  const status = computeStatus(entry.startDate, entry.endDate ?? null);
  const newerEntry = allEntries.find(
    (e) => new Date(e.startDate).getTime() > new Date(entry.startDate).getTime()
  );
  const hasAnnouncedNext = Boolean(entry.nextSeasonStartDate);
  const nextSeasonStartDate =
    entry.nextSeasonStartDate ??
    newerEntry?.startDate ??
    (avgDays ? estimateNextStart(entry.startDate, avgDays) : null);
  return {
    gameId,
    seasonName: entry.seasonName,
    seasonNumber: entry.seasonNumber,
    status,
    startDate: entry.startDate,
    endDate: entry.endDate ?? null,
    nextSeasonStartDate: nextSeasonStartDate ?? null,
    nextSeasonIsEstimated: !hasAnnouncedNext && !newerEntry,
    avgSeasonDurationDays: avgDays,
    description: entry.description,
    sourceUrl: entry.sourceUrl,
    confidence: entry.confidence,
    fetchedAt: new Date().toISOString(),
  };
}

const STATUS_PRIORITY = { upcoming: 0, active: 1, ended: 2, unknown: 3 };

export async function getAllSeasons(): Promise<SeasonData[]> {
  const allGameSeasons = await getAllGameSeasons();
  return allGameSeasons
    .map(({ gameId, seasons }) => {
      if (!seasons.length) return null;
      const sorted = [...seasons].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      const avgDays = computeAvgDuration(sorted);
      const current =
        sorted.find((s) => computeStatus(s.startDate, s.endDate ?? null) === "active") ??
        sorted.find((s) => computeStatus(s.startDate, s.endDate ?? null) === "upcoming") ??
        sorted[0];
      return toSeasonData(gameId, current, sorted, avgDays);
    })
    .filter(Boolean) as SeasonData[];
}

export async function getAllSeasonsPerGame(): Promise<Record<string, SeasonData[]>> {
  const all = await getAllGameSeasons();
  return Object.fromEntries(
    all.map(({ gameId, seasons }) => [gameId, _computeSeasonsForGame(gameId, seasons)])
  );
}

function _computeSeasonsForGame(gameId: string, entries: ManualSeasonEntry[]): SeasonData[] {
  const sorted = [...entries].sort((a, b) => {
    const sa = computeStatus(a.startDate, a.endDate ?? null);
    const sb = computeStatus(b.startDate, b.endDate ?? null);
    const pa = STATUS_PRIORITY[sa] ?? 3;
    const pb = STATUS_PRIORITY[sb] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
  const avgDays = computeAvgDuration(sorted);
  return sorted.map((entry) => toSeasonData(gameId, entry, sorted, avgDays));
}

export async function getSeasonsForGame(gameId: string): Promise<SeasonData[]> {
  const merged = await getGameSeasons(gameId);
  return _computeSeasonsForGame(gameId, merged);
}

export async function getSeasonsPerGameForIds(gameIds: string[]): Promise<Record<string, SeasonData[]>> {
  const all = await getAllGameSeasonsForIds(gameIds);
  return Object.fromEntries(
    all.map(({ gameId, seasons }) => [gameId, _computeSeasonsForGame(gameId, seasons)])
  );
}
