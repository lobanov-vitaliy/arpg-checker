import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormattedDate } from "@/components/FormattedDate";
import { GameImage } from "@/components/dashboard/GameImage";
import type { GameNewsItem } from "@/lib/steam-news";

interface NewsCardProps {
  item: GameNewsItem;
  locale: string;
  gameName?: string;
  gameHref?: string;
  glowColor?: string;
  coverImage?: string;
}

export function NewsCard({
  item,
  locale,
  gameName,
  gameHref,
  glowColor,
  coverImage,
}: NewsCardProps) {
  const t = useTranslations("news");
  const accent = glowColor ?? "#94a3b8";

  const gameChip = gameName && (
    <div className="flex items-center gap-2 min-w-0">
      {coverImage && (
        <div
          className="w-9 h-6 rounded overflow-hidden shrink-0"
          style={{ border: `1px solid ${accent}40` }}
        >
          <GameImage src={coverImage} alt={gameName} glowColor={accent} />
        </div>
      )}
      <span
        className="text-xs font-medium truncate"
        style={{ color: accent }}
      >
        {gameName}
      </span>
    </div>
  );

  return (
    <article
      className="rounded-xl p-4 flex flex-col gap-3 bg-white/3 border border-white/8 backdrop-blur-md hover:border-white/15 transition-colors"
      style={{ borderColor: `${accent}25` }}
    >
      <div className="flex flex-col gap-1">
        {gameChip && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {gameHref ? (
                <a
                  href={gameHref}
                  className="flex rounded-md px-1.5 py-1 -mx-1.5 -my-1 hover:bg-white/5 transition-colors max-w-full"
                >
                  {gameChip}
                </a>
              ) : (
                gameChip
              )}
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              <FormattedDate iso={item.publishedAt} locale={locale} />
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          {item.feedLabel ? (
            <span className="text-[10px] uppercase tracking-wider text-gray-500 truncate">
              {item.feedLabel}
            </span>
          ) : (
            <span />
          )}
          {!gameChip && (
            <span className="text-xs text-gray-500 shrink-0">
              <FormattedDate iso={item.publishedAt} locale={locale} />
            </span>
          )}
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
        {item.title}
      </h3>

      {item.excerpt && (
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">
          {item.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-gray-500 text-xs truncate">
          {item.author ?? "Steam"}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
        >
          {t("readMore")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
