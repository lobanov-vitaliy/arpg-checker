import { ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toIntlLocale } from "@/lib/utils";

interface TrustMetaProps {
  fetchedAt?: string;
  sourceUrl?: string;
}

function relativeTime(isoString: string, locale: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1_000);
  const rtf = new Intl.RelativeTimeFormat(toIntlLocale(locale), { numeric: "auto" });
  if (seconds < 60) return rtf.format(-seconds, "seconds");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minutes");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hours");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "days");
}

export function TrustMeta({ fetchedAt, sourceUrl }: TrustMetaProps) {
  const t = useTranslations("game");
  const locale = useLocale();

  if (!fetchedAt && !sourceUrl) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      {fetchedAt && (
        <span>
          {t("lastUpdated")} {relativeTime(fetchedAt, locale)}
        </span>
      )}
      {fetchedAt && sourceUrl && <span className="text-gray-700">·</span>}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-gray-300 transition-colors"
        >
          {t("sourceLink")}
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
