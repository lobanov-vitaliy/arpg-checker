// lib/steam-rating.ts

import type { SteamRating } from "@/types";

export function getSteamRatingTone(percent: number | null): {
  text: string;
  bg: string;
  ring: string;
  progress: string;
  emoji: string;
  icon: string;
} {
  if (percent === null) {
    return {
      text: "text-zinc-300",
      bg: "bg-zinc-500/10",
      ring: "ring-zinc-500/20",
      progress: "bg-zinc-400",
      emoji: "😶",
      icon: "○",
    };
  }

  if (percent >= 95) {
    return {
      text: "text-emerald-300",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
      progress: "bg-emerald-400",
      emoji: "😍",
      icon: "▲",
    };
  }

  if (percent >= 85) {
    return {
      text: "text-lime-300",
      bg: "bg-lime-500/10",
      ring: "ring-lime-500/20",
      progress: "bg-lime-400",
      emoji: "😄",
      icon: "▲",
    };
  }

  if (percent >= 75) {
    return {
      text: "text-yellow-300",
      bg: "bg-yellow-500/10",
      ring: "ring-yellow-500/20",
      progress: "bg-yellow-400",
      emoji: "🙂",
      icon: "■",
    };
  }

  if (percent >= 60) {
    return {
      text: "text-amber-300",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
      progress: "bg-amber-400",
      emoji: "😐",
      icon: "■",
    };
  }

  if (percent >= 40) {
    return {
      text: "text-orange-300",
      bg: "bg-orange-500/10",
      ring: "ring-orange-500/20",
      progress: "bg-orange-400",
      emoji: "😕",
      icon: "▼",
    };
  }

  return {
    text: "text-red-300",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    progress: "bg-red-400",
    emoji: "💀",
    icon: "▼",
  };
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSteamPercent(percent: number | null, digits = 2): string {
  if (percent === null) return "—";
  return `${percent.toFixed(digits)}%`;
}

export function getSteamRatingLabel(rating: SteamRating | null): string {
  if (!rating || rating.percent === null || rating.totalReviews === 0) {
    return "No reviews";
  }

  if (rating.reviewScoreDesc) {
    return rating.reviewScoreDesc;
  }

  if (rating.percent >= 95) return "Overwhelmingly Positive";
  if (rating.percent >= 85) return "Very Positive";
  if (rating.percent >= 75) return "Mostly Positive";
  if (rating.percent >= 60) return "Positive";
  if (rating.percent >= 40) return "Mixed";
  if (rating.percent >= 20) return "Mostly Negative";
  return "Very Negative";
}

export function getSteamRatingMeta(rating: SteamRating | null): {
  label: string;
  emoji: string;
  icon: string;
  text: string;
  bg: string;
  ring: string;
  progress: string;
} {
  const percent = rating?.percent ?? null;
  const tone = getSteamRatingTone(percent);

  return {
    label: getSteamRatingLabel(rating),
    emoji: tone.emoji,
    icon: tone.icon,
    text: tone.text,
    bg: tone.bg,
    ring: tone.ring,
    progress: tone.progress,
  };
}
