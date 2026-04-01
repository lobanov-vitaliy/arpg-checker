import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";
const SITE_NAME = "SeasonPulse";

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  ua: "uk_UA",
  es: "es_ES",
  pl: "pl_PL",
  de: "de_DE",
  fr: "fr_FR",
};

function localeToOg(locale: string) {
  return OG_LOCALE_MAP[locale] ?? "en_US";
}

const localeMetadata: Record<string, { title: string; description: string }> = {
  en: {
    title: "SeasonPulse — Track Game Seasons, Leagues, Wipes & Resets",
    description:
      "Track active seasons, leagues, ladders, wipes, and cycles for Diablo 4, Path of Exile, Last Epoch, and more. Countdown timers, start & end dates, upcoming resets — all in one place.",
  },
  ua: {
    title: "SeasonPulse — Відстежуй сезони, ліги та вайпи ігор",
    description:
      "Відстежуй активні сезони, ліги, ладдери, вайпи та цикли Diablo 4, Path of Exile, Last Epoch та інших. Таймери, дати старту й завершення, наступні ресети — все в одному місці.",
  },
  es: {
    title: "SeasonPulse — Sigue temporadas, ligas y reinicios de juegos",
    description:
      "Sigue temporadas activas, ligas, escaleras, wipes y ciclos de Diablo 4, Path of Exile, Last Epoch y más. Temporizadores, fechas de inicio y fin, próximos reinicios — todo en un solo lugar.",
  },
  pl: {
    title: "SeasonPulse — Śledź sezony, ligi i wipy gier",
    description:
      "Śledź aktywne sezony, ligi, drabinki, wipy i cykle Diablo 4, Path of Exile, Last Epoch i innych. Timery, daty startów i zakończeń, nadchodzące resety — wszystko w jednym miejscu.",
  },
  de: {
    title: "SeasonPulse — Verfolge Spielsaisons, Ligen, Wipes & Resets",
    description:
      "Verfolge aktive Saisons, Ligen, Ranglisten, Wipes und Zyklen von Diablo 4, Path of Exile, Last Epoch und mehr. Countdown-Timer, Start- & Enddaten, kommende Resets — alles an einem Ort.",
  },
  fr: {
    title: "SeasonPulse — Suivez les saisons, ligues et resets de jeux",
    description:
      "Suivez les saisons actives, ligues, classements, wipes et cycles de Diablo 4, Path of Exile, Last Epoch et plus. Minuteurs, dates de début et fin, prochains resets — tout en un seul endroit.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = localeMetadata[locale] ?? localeMetadata.en;

  return {
    title: {
      default: meta.title,
      template: `%s | ${SITE_NAME}`,
    },
    description: meta.description,
    metadataBase: new URL(SITE_URL),
    keywords: [
      "ARPG seasons",
      "game season tracker",
      "Path of Exile league",
      "Diablo 4 season",
      "Last Epoch cycle",
      "game reset tracker",
      "league start date",
      "season countdown",
      "wipe tracker",
    ],
    authors: [{ name: SITE_NAME }],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        uk: `${SITE_URL}/ua`,
        es: `${SITE_URL}/es`,
        pl: `${SITE_URL}/pl`,
        de: `${SITE_URL}/de`,
        fr: `${SITE_URL}/fr`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}`,
      locale: localeToOg(locale),
      alternateLocale: ["en_US", "uk_UA", "es_ES", "pl_PL", "de_DE", "fr_FR"].filter(
        (l) => l !== localeToOg(locale),
      ),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      site: "@seasonpulse",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
