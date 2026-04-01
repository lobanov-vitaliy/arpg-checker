"use client";

import { useEffect, useState } from "react";

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

interface CountdownEmbedProps {
  gameName: string;
  seasonName: string;
  glowColor: string;
  targetDate: string | null;
  label: string;
  labels: {
    days: string;
    hrs: string;
    min: string;
    sec: string;
    expired: string;
    poweredBy: string;
  };
}

export function CountdownEmbed({
  gameName,
  seasonName,
  glowColor,
  targetDate,
  label,
  labels,
}: CountdownEmbedProps) {
  const target = targetDate ? new Date(targetDate) : null;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!target) return;
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = timeLeft
    ? [
        { value: timeLeft.days, label: labels.days },
        { value: timeLeft.hours, label: labels.hrs },
        { value: timeLeft.minutes, label: labels.min },
        { value: timeLeft.seconds, label: labels.sec },
      ]
    : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] rounded-xl bg-gray-950 p-6">
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-0.5">
        {gameName}
      </p>
      <p className="text-sm font-semibold text-white mb-0.5">{seasonName}</p>
      {label && <p className="text-[10px] text-gray-500 mb-4">{label}</p>}

      {!target || !timeLeft ? (
        <p className="text-lg font-bold" style={{ color: glowColor }}>
          {labels.expired}
        </p>
      ) : (
        <div className="flex items-center gap-4">
          {units.map(({ value, label: unitLabel }) => (
            <div key={unitLabel} className="flex flex-col items-center">
              <span
                className="text-4xl font-black tabular-nums leading-none"
                style={{ color: glowColor }}
              >
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">
                {unitLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-gray-700 mt-4">{labels.poweredBy}</p>
    </div>
  );
}
