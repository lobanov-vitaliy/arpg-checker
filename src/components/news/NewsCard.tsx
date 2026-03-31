import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import type { NewsArticle } from "@/types";

const GAME_COLORS: Record<string, string> = {
  diablo4:             "bg-red-500/20 text-red-400 border-red-500/30",
  poe1:                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  poe2:                "bg-teal-500/20 text-teal-400 border-teal-500/30",
  lastepoch:           "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  torchlight_infinite: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  undecember:          "bg-violet-500/20 text-violet-400 border-violet-500/30",
  lost_ark:            "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

export function NewsCard({ article }: { article: NewsArticle }) {
  const t = useTranslations("news");
  const gameBadgeClass = article.gameId
    ? (GAME_COLORS[article.gameId] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30")
    : null;

  return (
    <Card className="border-gray-700/50 bg-gray-900/60 hover:border-gray-600/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {gameBadgeClass && article.gameName && (
              <Badge variant="outline" className={`text-xs ${gameBadgeClass}`}>
                {article.gameName}
              </Badge>
            )}
            {article.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-gray-700/40 text-gray-400 border-gray-600/40"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-gray-500 shrink-0">
            {article.publishedAt ? formatDate(article.publishedAt) : t("recently")}
          </span>
        </div>

        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
          {article.title}
        </h3>

        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
          {article.summary}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-gray-700/40">
          <span className="text-gray-500 text-xs">{article.source}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {t("readMore")} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
