import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGames } from "@/config/games";
import { getMultiGameNews } from "@/lib/steam-news";
import { NewsList } from "@/components/news/NewsList";
import { buildAlternates, toOgLocale, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });
  const title = t("title");
  const description = t("subtitle");
  const url = `${SITE_URL}/${locale}/news`;
  return {
    title,
    description,
    alternates: buildAlternates(locale, "/news"),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: toOgLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, games] = await Promise.all([
    getTranslations("news"),
    getGames(),
  ]);

  const items = await getMultiGameNews(games, 5, 60);
  const gameFilterList = games.map((g) => ({
    id: g.id,
    name: g.name,
    glowColor: g.glowColor,
  }));

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-1">{t("title")}</h1>
      <p className="text-gray-500 text-sm mb-8">{t("subtitle")}</p>
      <NewsList items={items} games={gameFilterList} locale={locale} />
    </main>
  );
}
