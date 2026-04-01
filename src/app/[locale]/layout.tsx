import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { getTranslations } from "next-intl/server";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";
const SITE_NAME = "SeasonPulse";

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
  ru: {
    title: "SeasonPulse — Отслеживай сезоны, лиги и вайпы игр",
    description:
      "Отслеживай активные сезоны, лиги, ладдеры, вайпы и циклы Diablo 4, Path of Exile, Last Epoch и других игр. Таймеры обратного отсчёта, даты старта и окончания, следующие ресеты — всё в одном месте.",
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
        ru: `${SITE_URL}/ru`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}`,
      locale: locale === "ua" ? "uk_UA" : locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: ["en_US", "uk_UA", "ru_RU"].filter(
        (l) =>
          l !==
          (locale === "ua" ? "uk_UA" : locale === "ru" ? "ru_RU" : "en_US"),
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

  if (!routing.locales.includes(locale as "en" | "ua" | "ru")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <meta name="apple-mobile-web-app-title" content="SeasonPulse" />

      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <div className="flex-1">{children}</div>
          <LocaleFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

async function LocaleFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-gray-800 py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-gray-600 text-xs">
        {t("disclaimer")}
      </div>
    </footer>
  );
}
