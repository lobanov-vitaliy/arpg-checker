import { useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/utils";
import type { SeasonData, SeasonType } from "@/types";

interface GameFAQProps {
  gameName: string;
  seasonType: SeasonType;
  activeSeason: SeasonData | null;
  locale: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function GameFAQ({ gameName, seasonType, activeSeason, locale }: GameFAQProps) {
  const t = useTranslations("game");

  if (!activeSeason) return null;

  const items: FAQItem[] = [];

  // Q1: When does the current season end?
  if (activeSeason.status === "active") {
    const q = t("faqCurrentEnd", { seasonType });
    let a: string;
    if (activeSeason.endDate) {
      a = `The current ${gameName} ${seasonType} ends on ${formatDate(activeSeason.endDate, locale)}.`;
      if (activeSeason.confidence === "medium") a += " This date is estimated.";
      if (activeSeason.confidence === "low") a += " This date is inferred from historical averages.";
    } else {
      a = `No end date has been officially announced for the current ${gameName} ${seasonType} yet.`;
    }
    items.push({ question: q, answer: a });
  }

  // Q2: When does the next season start?
  if (activeSeason.nextSeasonStartDate) {
    const q = t("faqNextStart", { seasonType });
    const dateStr = formatDate(activeSeason.nextSeasonStartDate, locale);
    const isEstimated = activeSeason.nextSeasonIsEstimated ?? false;
    const a = isEstimated
      ? `The next ${gameName} ${seasonType} is estimated to start around ${dateStr}. This is based on historical average season lengths and is not yet officially confirmed.`
      : `The next ${gameName} ${seasonType} is scheduled to start on ${dateStr}. This date has been officially confirmed.`;
    items.push({ question: q, answer: a });
  }

  // Q3: Is the date confirmed?
  if (activeSeason.nextSeasonStartDate || activeSeason.endDate) {
    const q = t("faqConfirmed", { seasonType });
    const confidenceMap = {
      high: `Yes — the date shown for the ${gameName} ${seasonType} is officially confirmed by the developer.`,
      medium: `Not yet — the date shown is estimated based on historical data and has not been officially announced.`,
      low: `No — the date is inferred from average season durations. Treat it as a rough estimate only.`,
    };
    items.push({ question: q, answer: confidenceMap[activeSeason.confidence] });
  }

  // Q4: How long do seasons usually last?
  if (activeSeason.avgSeasonDurationDays) {
    const q = t("faqDuration", { game: gameName, seasonType });
    const a = `${gameName} ${seasonType}s typically last around ${activeSeason.avgSeasonDurationDays} days, based on the average of recent completed ${seasonType}s.`;
    items.push({ question: q, answer: a });
  }

  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2
        id="faq-heading"
        className="text-lg font-semibold text-white mb-4"
      >
        {t("faqTitle")}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="rounded-lg bg-white/3 border border-white/8 backdrop-blur-md group"
          >
            <summary className="px-4 py-3 text-sm font-medium text-gray-200 cursor-pointer select-none list-none flex items-center justify-between gap-2 hover:text-white transition-colors">
              {item.question}
              <span className="text-gray-500 text-xs shrink-0 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="px-4 pb-4 pt-1 text-sm text-gray-400 leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
