import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const INTL_LOCALE: Record<string, string> = {
  ua: "uk",
};

export function toIntlLocale(locale: string): string {
  return INTL_LOCALE[locale] ?? locale;
}

export function formatDate(iso: string, locale = "en"): string {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// True if the ISO string carries a time component (e.g. "2026-03-20T18:00:00Z").
export function hasTime(iso: string): boolean {
  return typeof iso === "string" && iso.includes("T");
}

// Renders date + time in the caller's timezone. Server tz on SSR, browser tz on CSR —
// wrap in <FormattedDate> for hydration-safe output when the string has time.
export function formatDateTime(iso: string, locale = "en"): string {
  const d = new Date(iso);
  if (!hasTime(iso)) {
    return d.toLocaleDateString(toIntlLocale(locale), {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return d.toLocaleString(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
