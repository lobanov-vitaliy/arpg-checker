import { useTranslations } from "next-intl";
import { NewsCard } from "./NewsCard";
import type { NewsArticle } from "@/types";

export function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  const t = useTranslations("news");

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">{t("empty")}</p>
        <p className="text-sm">{t("emptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
