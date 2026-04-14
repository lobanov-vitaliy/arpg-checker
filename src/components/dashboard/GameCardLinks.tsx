"use client";

import { ExternalLink, Timer, CalendarDays } from "lucide-react";
interface Props {
  gameId: string;
  gameName: string;
  officialUrl: string;
  countdownHref: string;
  calendarHref: string;
  glowColor: string;
  officialLabel: string;
  calendarTitle: string;
}

export function GameCardLinks({
  officialUrl,
  countdownHref,
  calendarHref,
  glowColor,
  officialLabel,
  calendarTitle,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
      <a
        href={officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs hover:underline"
        style={{ color: glowColor }}
      >
        <ExternalLink className="w-3 h-3" /> {officialLabel}
      </a>
      <div className="flex items-center gap-2">
        <a
          href={countdownHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title="Countdown"
        >
          <Timer className="w-3.5 h-3.5" />
        </a>
        <a
          href={calendarHref}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title={calendarTitle}
        >
          <CalendarDays className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
