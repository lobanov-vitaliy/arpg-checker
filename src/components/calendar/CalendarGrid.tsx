"use client";

import { useState, Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";

export interface CalendarEvent {
  date: string; // "YYYY-MM-DD"
  type: "starts" | "ends";
  gameId: string;
  gameName: string;
  glowColor: string;
  seasonName: string;
  isEstimated?: boolean;
  avgSeasonDurationDays?: number | null;
  seasonType?: string;
}

export interface CalendarGame {
  id: string;
  name: string;
  glowColor: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDow(d: Date): number {
  return (d.getDay() + 6) % 7; // Mon=0 … Sun=6
}

function buildWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const startOffset = getDow(firstDay);
  const lastDay = new Date(year, month + 1, 0);
  const endOffset = getDow(lastDay);
  const calStart = new Date(year, month, 1 - startOffset);
  const weeksCount = Math.ceil(
    (startOffset + lastDay.getDate() + (6 - endOffset)) / 7,
  );

  return Array.from({ length: weeksCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(calStart);
      day.setDate(calStart.getDate() + w * 7 + d);
      return day;
    }),
  );
}

// ── inner component ───────────────────────────────────────────────────────────

interface Props {
  events: CalendarEvent[];
  games: CalendarGame[];
  initialYear: number;
  initialMonth: number;
}

function CalendarGridInner({
  events,
  games,
  initialYear,
  initialMonth,
}: Props) {
  const t = useTranslations("calendar");
  const tFilter = useTranslations("filter");
  const tEst = useTranslations("estimate");
  const tDash = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedGames, setSelectedGames] = useState<string[]>(
    () => searchParams.get("game")?.split(",").filter(Boolean) ?? [],
  );

  const MONTHS = [
    t("january"),
    t("february"),
    t("march"),
    t("april"),
    t("may"),
    t("june"),
    t("july"),
    t("august"),
    t("september"),
    t("october"),
    t("november"),
    t("december"),
  ];
  const DAYS = [
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
    t("sun"),
  ];

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const pushGames = (next: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) params.set("game", next.join(","));
    else params.delete("game");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleGame = (id: string) => {
    const adding = !selectedGames.includes(id);
    const next = adding ? [...selectedGames, id] : selectedGames.filter((g) => g !== id);
    if (adding) track("calendar_filter_game", { gameId: id });
    setSelectedGames(next);
    pushGames(next);
  };

  const clearGames = () => {
    setSelectedGames([]);
    pushGames([]);
  };

  const filteredEvents =
    selectedGames.length > 0
      ? events.filter((e) => selectedGames.includes(e.gameId))
      : events;

  // Group events by date
  const byDate: Record<string, CalendarEvent[]> = {};
  for (const e of filteredEvents) {
    (byDate[e.date] ??= []).push(e);
  }

  const weeks = buildWeeks(year, month);
  const todayStr = toDateStr(new Date());

  return (
    <div>
      {/* ── Game filter tags ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={clearGames}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            selectedGames.length === 0
              ? "bg-white/10 text-white border-white/20"
              : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300"
          }`}
        >
          {tFilter("all")}
        </button>
        {games.map((game) => {
          const selected = selectedGames.includes(game.id);
          return (
            <button
              key={game.id}
              onClick={() => toggleGame(game.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
              style={{
                backgroundColor: selected ? `${game.glowColor}20` : "transparent",
                borderColor: selected ? `${game.glowColor}50` : "rgba(55,65,81,1)",
                color: selected ? game.glowColor : "#9ca3af",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: selected ? game.glowColor : `${game.glowColor}50`,
                }}
              />
              {game.name}
            </button>
          );
        })}
      </div>

      {/* ── Month nav ── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prev}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={next}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Day headers ── */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] text-gray-600 uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Weeks ── */}
      <div className="grid grid-cols-7 border-l border-t border-gray-800 overflow-visible backdrop-blur-md bg-gray-900/30 rounded-b-lg">
        {weeks.flat().map((date, i) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = toDateStr(date) === todayStr;
          const ds = toDateStr(date);
          const dayEvents = byDate[ds] ?? [];

          return (
            <div
              key={i}
              className={`min-h-28 border-r border-b border-gray-800 p-1.5 overflow-visible ${!isCurrentMonth ? "bg-gray-950/60" : ""}`}
            >
              {/* Date number */}
              <div className="mb-1.5">
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium
                  ${isToday ? "bg-white text-black font-bold" : isCurrentMonth ? "text-gray-400" : "text-gray-700"}`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5">
                {dayEvents.map((event, ei) => (
                  <div
                    key={ei}
                    className="px-1.5 py-0.5 rounded text-[10px] leading-tight relative group"
                    style={{
                      backgroundColor: `${event.glowColor}18`,
                      borderLeft: `2px solid ${event.type === "ends" ? `${event.glowColor}60` : event.glowColor}`,
                    }}
                  >
                    <div
                      className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        color:
                          event.type === "ends"
                            ? `${event.glowColor}90`
                            : event.glowColor,
                      }}
                    >
                      {event.type === "starts" ? "▶ " : "■ "}
                      {event.gameName}
                    </div>
                    <div className="flex items-center gap-1 mt-px">
                      <span className="text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                        {event.seasonName}
                      </span>
                      {event.isEstimated === true && (
                        <span className="shrink-0 px-1 py-px rounded text-[9px] font-medium bg-yellow-500/10 text-yellow-500/70 cursor-default">
                          {tDash("estimated")}
                        </span>
                      )}
                      {event.isEstimated === false &&
                        event.type === "starts" && (
                          <span className="shrink-0 px-1 py-px rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-500/70 cursor-default">
                            {tDash("official")}
                          </span>
                        )}
                    </div>

                    {/* Estimated tooltip */}
                    {event.isEstimated === true &&
                      event.avgSeasonDurationDays &&
                      event.seasonType && (
                        <div className="absolute bottom-full left-0 mb-1.5 w-56 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <span className="block bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
                            {tEst("tooltip", {
                              seasonType: event.seasonType,
                              days: event.avgSeasonDurationDays,
                            })}
                          </span>
                        </div>
                      )}

                    {/* Official tooltip */}
                    {event.isEstimated === false && event.type === "starts" && (
                      <div className="absolute bottom-full left-0 mb-1.5 w-56 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="block bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
                          {tDash("officialTooltip")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarGrid(props: Props) {
  return (
    <Suspense fallback={null}>
      <CalendarGridInner {...props} />
    </Suspense>
  );
}
