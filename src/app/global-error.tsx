"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="has-bg min-h-full flex flex-col bg-gray-950 text-gray-100">
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="relative inline-block mb-6">
              <span className="text-[120px] sm:text-[160px] font-black text-white/3 leading-none select-none">
                500
              </span>
              <AlertTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-red-500/60" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Something Went Wrong
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              An unexpected error occurred. Please try again later.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
