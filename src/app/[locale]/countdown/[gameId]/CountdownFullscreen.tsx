"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Link2, Share2, Code, Check, X } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface Labels {
  noUpcoming: string;
  checkBack: string;
  copyLink: string;
  copied: string;
  share: string;
  embed: string;
  embedCode: string;
  embedCopied: string;
  back: string;
  poweredBy: string;
  days: string;
  hrs: string;
  min: string;
  sec: string;
  expired: string;
}

interface CountdownFullscreenProps {
  gameName: string;
  gameId: string;
  seasonName: string;
  glowColor: string;
  coverImage: string;
  targetDate: string | null;
  label: string;
  locale: string;
  pageUrl: string;
  embedUrl: string;
  labels: Labels;
}

export function CountdownFullscreen({
  gameName,
  gameId,
  seasonName,
  glowColor,
  coverImage,
  targetDate,
  label,
  locale,
  pageUrl,
  embedUrl,
  labels,
}: CountdownFullscreenProps) {
  const target = targetDate ? new Date(targetDate) : null;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (!target) return;
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const copyToClipboard = useCallback(
    async (text: string, type: "link" | "embed") => {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    [],
  );

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${gameName} — ${seasonName}`,
        url: pageUrl,
      });
    } else {
      copyToClipboard(pageUrl, "link");
    }
  }, [gameName, seasonName, pageUrl, copyToClipboard]);

  const embedCode = `<iframe src="${embedUrl}" width="480" height="260" style="border:none;border-radius:12px" allowtransparency="true"></iframe>`;

  const units = timeLeft
    ? [
        { value: timeLeft.days, label: labels.days },
        { value: timeLeft.hours, label: labels.hrs },
        { value: timeLeft.minutes, label: labels.min },
        { value: timeLeft.seconds, label: labels.sec },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px) saturate(1.5)",
        }}
      />

      {showEmbed && (
        <div className="absolute top-16 right-6 z-50 w-96 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">
              {labels.embedCode}
            </span>
            <button
              onClick={() => setShowEmbed(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <pre className="bg-black/50 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-all select-all">
            {embedCode}
          </pre>
          <button
            onClick={() => copyToClipboard(embedCode, "embed")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
          >
            {copied === "embed" ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            {copied === "embed" ? labels.embedCopied : labels.copyLink}
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">
          {gameName}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {seasonName}
        </h1>
        {label && <p className="text-sm text-gray-400 mb-10">{label}</p>}

        {!target ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xl text-gray-400">{labels.noUpcoming}</p>
            <p className="text-sm text-gray-600">{labels.checkBack}</p>
          </div>
        ) : !timeLeft ? (
          <p className="text-2xl font-bold" style={{ color: glowColor }}>
            {labels.expired}
          </p>
        ) : (
          <div className="flex items-center gap-4 sm:gap-8">
            {units.map(({ value, label: unitLabel }) => (
              <div key={unitLabel} className="flex flex-col items-center">
                <span
                  className="text-6xl sm:text-8xl md:text-9xl font-black tabular-nums leading-none"
                  style={{ color: glowColor }}
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-gray-500 mt-2">
                  {unitLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="absolute bottom-6 text-xs text-gray-700">
        {labels.poweredBy}
      </p>
    </div>
  );
}
