"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CountdownTimerProps {
  targetDate: Date;
  label: string;
  accentColor: string;
  isEstimated?: boolean;
}

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

export function CountdownTimer({
  targetDate,
  label,
  accentColor,
  isEstimated,
}: CountdownTimerProps) {
  const t = useTranslations("countdown");
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="bg-black/30 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            {label}
          </p>
        </div>
        <p className={`text-sm font-semibold ${accentColor}`}>{t("expired")}</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: t("days") },
    { value: timeLeft.hours, label: t("hrs") },
    { value: timeLeft.minutes, label: t("min") },
    { value: timeLeft.seconds, label: t("sec") },
  ];

  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {units.map(({ value, label: unit }) => (
          <div key={unit}>
            <div
              className={`text-base font-mono font-bold tabular-nums ${accentColor}`}
            >
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
