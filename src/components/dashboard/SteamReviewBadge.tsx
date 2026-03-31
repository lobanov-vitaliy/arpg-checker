import type { SteamRating } from "@/types";
import {
  formatCompactNumber,
  formatSteamPercent,
  getSteamRatingMeta,
} from "@/lib/steam-rating";

type SteamReviewBadgeProps = {
  rating: SteamRating | null;
};

export function SteamReviewBadge({ rating }: SteamReviewBadgeProps) {
  const meta = getSteamRatingMeta(rating);

  return (
    <div
      className={["flex items-center gap-1  py-1 text-xs", meta.ring].join(" ")}
    >
      <span className={`font-semibold ${meta.text}`}>
        {formatSteamPercent(rating?.percent ?? null)}
      </span>
      <span className="text-zinc-400">•</span>
      <span className={`font-semibold ${meta.text}`}>{meta.label}</span>
      <span className="text-zinc-400">•</span>
      <span className="text-zinc-300">
        {formatCompactNumber(rating?.totalReviews ?? 0)} reviews
      </span>
    </div>
  );
}
