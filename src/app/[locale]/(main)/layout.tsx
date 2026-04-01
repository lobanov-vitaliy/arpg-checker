import { Navbar } from "@/components/layout/Navbar";
import { getTranslations, getLocale } from "next-intl/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      <MainFooter />
    </>
  );
}

async function MainFooter() {
  const [t, locale] = await Promise.all([getTranslations("footer"), getLocale()]);
  return (
    <footer className="border-t border-gray-800 py-6 mt-8">
      <div className="container mx-auto px-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-xs">
          <a href={`/${locale}/about`} className="text-gray-500 hover:text-gray-300 transition-colors">
            {t("about")}
          </a>
          <span className="text-gray-800">·</span>
          <a href={`/${locale}/privacy`} className="text-gray-500 hover:text-gray-300 transition-colors">
            {t("privacy")}
          </a>
        </div>
        <p className="text-gray-600 text-xs">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
