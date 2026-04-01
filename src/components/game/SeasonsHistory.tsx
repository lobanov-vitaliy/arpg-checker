import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SeasonData } from "@/types";

interface SeasonsHistoryProps {
  seasons: SeasonData[];
  glowColor: string;
  labels: {
    title: string;
    started: string;
    ends: string;
    duration: string;
    source: string;
  };
}

const STATUS_STYLES = {
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  upcoming: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  ended: "bg-white/5 text-gray-500 border border-white/10",
  unknown: "bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20",
};

const STATUS_DOT = {
  active: "bg-green-400 animate-pulse",
  upcoming: "bg-blue-400",
  ended: "bg-gray-600",
  unknown: "bg-yellow-500/50",
};

function durationDays(start: string, end: string | null): string | null {
  if (!end) return null;
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
  return `${days}d`;
}

export function SeasonsHistory({ seasons, glowColor, labels }: SeasonsHistoryProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">{labels.title}</h2>

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_120px_120px_72px_28px] gap-x-4 px-4 mb-2">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{labels.started}</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{labels.ends}</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{labels.duration}</span>
        <span />
      </div>

      <div className="flex flex-col gap-1.5">
        {seasons.map((season, i) => (
          <div
            key={i}
            className="rounded-lg px-4 py-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_72px_28px] gap-x-4 gap-y-2 items-center"
            style={{
              backgroundColor: season.status === "active" ? `${glowColor}0a` : "rgba(255,255,255,0.02)",
              border: `1px solid ${season.status === "active" ? `${glowColor}30` : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {/* Name + badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_STYLES[season.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[season.status]}`} />
                {season.seasonNumber ? `#${season.seasonNumber}` : "—"}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{season.seasonName}</p>
                {season.description && (
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1 leading-relaxed">
                    {season.description}
                  </p>
                )}
              </div>
            </div>

            {/* Started */}
            <div>
              <span className="sm:hidden text-[10px] text-gray-600 uppercase tracking-wider mr-1">
                {labels.started}:
              </span>
              <span className="text-gray-300 text-xs">
                {season.startDate ? formatDate(season.startDate) : "—"}
              </span>
            </div>

            {/* Ends */}
            <div>
              <span className="sm:hidden text-[10px] text-gray-600 uppercase tracking-wider mr-1">
                {labels.ends}:
              </span>
              <span className="text-gray-300 text-xs">
                {season.endDate ? formatDate(season.endDate) : "—"}
              </span>
            </div>

            {/* Duration */}
            <div>
              <span className="sm:hidden text-[10px] text-gray-600 uppercase tracking-wider mr-1">
                {labels.duration}:
              </span>
              <span className="text-gray-400 text-xs">
                {season.startDate && season.endDate
                  ? durationDays(season.startDate, season.endDate)
                  : "—"}
              </span>
            </div>

            {/* Source */}
            <div className="flex justify-end">
              {season.sourceUrl ? (
                <a
                  href={season.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                  title={labels.source}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
