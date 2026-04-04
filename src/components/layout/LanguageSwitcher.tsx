"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { track } from "@vercel/analytics";

const LOCALE_META: Record<string, string> = {
  en: "English",
  ua: "Українська",
  es: "Español",
  pl: "Polski",
  de: "Deutsch",
  fr: "Français",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(next: string) {
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as (typeof routing.locales)[number])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    track("language_switch", { locale: next });
    router.push(segments.join("/") || "/");
    setOpen(false);
  }

  const current = LOCALE_META[locale] ?? LOCALE_META.en;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{current}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-gray-700 bg-gray-900 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {routing.locales.map((loc) => {
            const label = LOCALE_META[loc] ?? loc;
            const active = loc === locale;
            return (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-white"
                }`}
              >
                <span>{label}</span>
                {active && (
                  <svg className="w-3.5 h-3.5 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
