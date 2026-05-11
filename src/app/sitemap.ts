import { getGames } from "@/config/games";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seasonpulse.fun";
const LOCALES = ["en", "ua", "es", "pl", "de", "fr"] as const;

function hreflang(locale: string): string {
  return locale === "ua" ? "uk" : locale;
}

function buildLanguages(path: string): Record<string, string> {
  return {
    "x-default": `${SITE_URL}/en${path}`,
    ...Object.fromEntries(
      LOCALES.map((l) => [hreflang(l), `${SITE_URL}/${l}${path}`]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  type StaticPage = {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  };

  const staticPages: StaticPage[] = [
    { path: "", changeFrequency: "hourly", priority: 1.0 },
    { path: "/news", changeFrequency: "hourly", priority: 0.8 },
    { path: "/calendar", changeFrequency: "daily", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  ];

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticPages.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages: buildLanguages(path) },
    })),
  );

  // Game pages (detail + countdown). Swallow DB errors at build time.
  let gameEntries: MetadataRoute.Sitemap = [];
  let countdownEntries: MetadataRoute.Sitemap = [];
  try {
    const games = await getGames();
    gameEntries = LOCALES.flatMap((locale) =>
      games.map((game) => ({
        url: `${SITE_URL}/${locale}/game/${game.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: { languages: buildLanguages(`/game/${game.id}`) },
      })),
    );
    countdownEntries = LOCALES.flatMap((locale) =>
      games.map((game) => ({
        url: `${SITE_URL}/${locale}/countdown/${game.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
        alternates: { languages: buildLanguages(`/countdown/${game.id}`) },
      })),
    );
  } catch {
    // If DB is unavailable at build time, skip game pages gracefully.
  }

  return [...staticEntries, ...gameEntries, ...countdownEntries];
}
