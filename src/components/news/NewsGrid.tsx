import { useTranslations } from "next-intl";
import { NewsCard } from "./NewsCard";
import type { MultiGameNewsItem } from "@/lib/steam-news";

interface NewsGridProps {
  items: MultiGameNewsItem[];
  locale: string;
}

export function NewsGrid({ items, locale }: NewsGridProps) {
  const t = useTranslations("news");

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">{t("empty")}</p>
        <p className="text-sm">{t("emptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <NewsCard
          key={`${item.gameId}-${item.id}`}
          item={item}
          locale={locale}
          gameName={item.gameName}
          gameHref={`/${locale}/game/${item.gameId}`}
          glowColor={item.glowColor}
          coverImage={item.coverImage}
        />
      ))}
    </div>
  );
}
