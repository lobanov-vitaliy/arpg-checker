import { getTranslations, getLocale } from "next-intl/server";
import { XIcon } from "@/components/layout/XIcon";

const POPULAR_GAMES = [
  { id: "cs2", name: "Counter-Strike 2" },
  { id: "call_of_duty", name: "Call of Duty" },
  { id: "apex_legends", name: "Apex Legends" },
  { id: "destiny_2", name: "Destiny 2" },
  { id: "marvel_rivals", name: "Marvel Rivals" },
];

const MORE_GAMES = [
  { id: "poe1", name: "Path of Exile" },
  { id: "overwatch", name: "Overwatch 2" },
  { id: "diablo4", name: "Diablo IV" },
  { id: "pubg", name: "PUBG" },
  { id: "poe2", name: "Path of Exile 2" },
];

export async function SiteFooter() {
  const [t, locale] = await Promise.all([
    getTranslations("footer"),
    getLocale(),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t backdrop-blur-sm border-white/5 ">
      <div className="container mx-auto px-4 py-10">
        {/* Top section: columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Popular Games */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {t("popularGames")}
            </h3>
            <ul className="space-y-2">
              {POPULAR_GAMES.map((game) => (
                <li key={game.id}>
                  <a
                    href={`/${locale}/game/${game.id}`}
                    className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {game.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* More Games */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {t("moreGames")}
            </h3>
            <ul className="space-y-2">
              {MORE_GAMES.map((game) => (
                <li key={game.id}>
                  <a
                    href={`/${locale}/game/${game.id}`}
                    className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {game.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {t("aboutTitle")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`/${locale}/about`}
                  className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {t("about")}
                </a>
              </li>
              <li>
                <a
                  href={`/${locale}/privacy`}
                  className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {t("privacy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Social
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://x.com/seasonpulsefun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors"
                aria-label="X (Twitter)"
              >
                <XIcon className="w-4 h-4 shrink-0" />
                <span>@seasonpulsefun</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: copyright */}
        <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
          <p className="text-xs text-gray-600">{t("copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
