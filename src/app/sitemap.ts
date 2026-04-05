import { getGames } from "@/config/games";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";
const LOCALES = ["en", "ua", "es", "pl", "de", "fr"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const staticPages = [""];
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticPages.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: path === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [
            l === "ua" ? "uk" : l,
            `${SITE_URL}/${l}${path}`,
          ]),
        ),
      },
    })),
  );

  // Game pages
  let gameEntries: MetadataRoute.Sitemap = [];
  try {
    const games = await getGames();
    gameEntries = LOCALES.flatMap((locale) =>
      games.map((game) => ({
        url: `${SITE_URL}/${locale}/game/${game.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l === "ua" ? "uk" : l,
              `${SITE_URL}/${l}/game/${game.id}`,
            ]),
          ),
        },
      })),
    );
  } catch {
    // If DB is unavailable at build time, skip game pages gracefully
  }

  return [...staticEntries, ...gameEntries];
}
