import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seasonpulse.fun";
export const SITE_NAME = "SeasonPulse";

export const LOCALES = ["en", "ua", "es", "pl", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  ua: "uk_UA",
  es: "es_ES",
  pl: "pl_PL",
  de: "de_DE",
  fr: "fr_FR",
};

export function toOgLocale(locale: string): string {
  return OG_LOCALE_MAP[locale] ?? "en_US";
}

// next.js Metadata.alternates.languages uses BCP 47 codes, so map "ua" → "uk".
function hreflangForLocale(locale: string): string {
  return locale === "ua" ? "uk" : locale;
}

// Build hreflang alternates for a given relative path (e.g. "/calendar", "/game/foo").
export function buildAlternates(locale: string, path: string): Metadata["alternates"] {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {
    "x-default": `${SITE_URL}/en${clean}`,
  };
  for (const l of LOCALES) {
    languages[hreflangForLocale(l)] = `${SITE_URL}/${l}${clean}`;
  }
  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages,
  };
}

// Ensure a title fits in typical SERP limits (<=60 chars incl. the template suffix).
// The locale layout appends " | SeasonPulse" (~14 chars), so trim the dynamic part
// to 60 - 14 - 1 = 45, then append an ellipsis if truncated.
const SITE_NAME_SUFFIX_LEN = " | SeasonPulse".length;
export function truncateTitle(
  title: string,
  maxTotal = 60,
  suffixLen = SITE_NAME_SUFFIX_LEN,
): string {
  const cap = Math.max(20, maxTotal - suffixLen);
  if (title.length <= cap) return title;
  return `${title.slice(0, cap - 1).trimEnd()}…`;
}

// Clamp a meta description to a safe length (Google usually truncates around 155–160).
export function clampDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
