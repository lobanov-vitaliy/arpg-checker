import { GAME_SEASONS, type ManualSeasonEntry } from "@/data/seasons";
import type { SeasonData } from "@/types";

function computeStatus(startDate: string, endDate: string | null): SeasonData["status"] {
  const now = Date.now();
  if (new Date(startDate).getTime() > now) return "upcoming";
  if (endDate && new Date(endDate).getTime() < now) return "ended";
  return "active";
}

// Compute average duration from last 3-4 seasons that have both start and end dates
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

export function getAllSeasons(): SeasonData[] {
  return GAME_SEASONS.map(({ gameId, seasons }) => {
    const sorted = [...seasons].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const avgDays = computeAvgDuration(sorted);
    const current =
      sorted.find((s) => computeStatus(s.startDate, s.endDate ?? null) === "active") ??
      sorted.find((s) => computeStatus(s.startDate, s.endDate ?? null) === "upcoming") ??
      sorted[0];
    return toSeasonData(gameId, current, sorted, avgDays);
  });
}

const STATUS_PRIORITY = { upcoming: 0, active: 1, ended: 2, unknown: 3 };

export function getSeasonsForGame(gameId: string): SeasonData[] {
  const game = GAME_SEASONS.find((g) => g.gameId === gameId);
  if (!game) return [];
  // Sort: active first, upcoming second, then ended newest-first
  const sorted = [...game.seasons].sort((a, b) => {
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
