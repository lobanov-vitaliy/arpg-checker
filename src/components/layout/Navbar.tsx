import { getTranslations, getLocale } from "next-intl/server";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";

export async function Navbar() {
  const [t, locale] = await Promise.all([getTranslations("nav"), getLocale()]);

  const links = [
    { href: `/${locale}`, label: t("dashboard") },
    { href: `/${locale}/calendar`, label: t("calendar") },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href={`/${locale}`}
            className="flex items-center gap-2 font-bold text-white hover:text-gray-200 transition-colors"
          >
            <img src="/logo.png" alt="SeasonPulse" width={42} className="shrink-0" />
            <span>Season Pulse</span>
          </a>
          <NavLinks links={links} />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
