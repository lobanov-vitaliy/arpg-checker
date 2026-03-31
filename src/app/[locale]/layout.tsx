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

export const metadata: Metadata = {
  title: "ARPG Checker — Season & League Tracker",
  description:
    "Real-time season and league information for Diablo, Path of Exile, Last Epoch and more.",
};

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
