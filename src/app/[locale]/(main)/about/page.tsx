import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Info, Search, Cpu, Heart, Mail } from "lucide-react";
import { buildAlternates, toOgLocale, SITE_NAME, SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("title");
  const description = t("intro");
  const url = `${SITE_URL}/${locale}/about`;
  return {
    title,
    description,
    alternates: buildAlternates(locale, "/about"),
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

export default async function AboutPage() {
  const t = await getTranslations("about");

  const sections = [
    { icon: Search, title: t("whatTitle"), text: t("whatText") },
    { icon: Cpu, title: t("howTitle"), text: t("howText") },
    { icon: Heart, title: t("openTitle"), text: t("openText") },
    { icon: Mail, title: t("contactTitle"), text: t("contactText") },
  ];

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Info className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
      </div>
      <p className="text-gray-400 text-sm mb-10">{t("intro")}</p>

      <div className="flex flex-col gap-8">
        {sections.map(({ icon: Icon, title, text }) => (
          <section key={title}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-cyan-400/70" />
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
