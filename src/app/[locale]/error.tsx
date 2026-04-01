"use client";

import { useTranslations } from "next-intl";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-6">
          <span className="text-[120px] sm:text-[160px] font-black text-white/3 leading-none select-none">
            {t("serverCode")}
          </span>
          <AlertTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-red-500/60" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          {t("serverTitle")}
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          {t("serverText")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-sm text-white hover:bg-white/15 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t("backHome")}
          </a>
        </div>
      </div>
    </main>
  );
}
