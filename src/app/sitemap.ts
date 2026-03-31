import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.gg";
const LOCALES = ["en", "ua", "ru"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const pages = ["", "/news"];

  return LOCALES.flatMap((locale) =>
    pages.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: path === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l === "ua" ? "uk" : l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
