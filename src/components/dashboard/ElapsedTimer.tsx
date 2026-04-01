"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ElapsedTimerProps {
  startDate: Date;
  label: string;
}

interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getElapsed(start: Date): Elapsed {
  const diff = Math.max(0, Date.now() - start.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function ElapsedTimer({ startDate, label }: ElapsedTimerProps) {
  const t = useTranslations("elapsed");
  const [elapsed, setElapsed] = useState<Elapsed>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setElapsed(getElapsed(startDate));
    const interval = setInterval(() => {
      setElapsed(getElapsed(startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const units = [
    { value: elapsed.days, label: t("days") },
    { value: elapsed.hours, label: t("hrs") },
    { value: elapsed.minutes, label: t("min") },
    { value: elapsed.seconds, label: t("sec") },
  ];

  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-4 gap-1 text-center">
        {units.map(({ value, label: unit }) => (
          <div key={unit}>
            <div className="text-base font-mono font-bold tabular-nums text-gray-300">
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-gray-600 text-xs mt-0.5">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
