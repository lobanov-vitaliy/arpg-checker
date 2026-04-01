"use client";

import { useState, Suspense } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  const [gameOpen, setGameOpen] = useState(false);
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
    const next = selectedGames.includes(id)
      ? selectedGames.filter((g) => g !== id)
      : [...selectedGames, id];
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

  // Filter button label
  const filterLabel =
    selectedGames.length === 0
      ? tFilter("all")
      : selectedGames.length === 1
        ? (games.find((g) => g.id === selectedGames[0])?.name ?? "1")
        : `${selectedGames.length} games`;

  return (
    <div>
      {/* ── Game filter ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <button
            onClick={() => setGameOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 transition-colors min-w-44"
          >
            {selectedGames.length === 1 && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: games.find((g) => g.id === selectedGames[0])
                    ?.glowColor,
                }}
              />
            )}
            {selectedGames.length > 1 && (
              <span className="flex gap-0.5 shrink-0">
                {selectedGames.slice(0, 3).map((id) => (
                  <span
                    key={id}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: games.find((g) => g.id === id)
                        ?.glowColor,
                    }}
                  />
                ))}
              </span>
            )}
            <span className="flex-1 text-left truncate">{filterLabel}</span>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform duration-150"
              style={{
                transform: gameOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {gameOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setGameOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-20 min-w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                <button
                  onClick={clearGames}
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-800 flex items-center gap-2"
                  style={{
                    color: selectedGames.length === 0 ? "#fff" : "#9ca3af",
                  }}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {selectedGames.length === 0 && (
                      <Check className="w-3 h-3" />
                    )}
                  </span>
                  {tFilter("all")}
                </button>
                <div className="border-t border-gray-800" />
                {games.map((game) => {
                  const selected = selectedGames.includes(game.id);
                  return (
                    <button
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-800 flex items-center gap-2"
                      style={{ color: selected ? "#fff" : "#9ca3af" }}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selected ? (
                          <Check
                            className="w-3 h-3"
                            style={{ color: game.glowColor }}
                          />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: `${game.glowColor}50` }}
                          />
                        )}
                      </span>
                      {game.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
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
      <div className="grid grid-cols-7 border-l border-t border-gray-800 overflow-visible">
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
                          <span className="block bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
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
                        <span className="block bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
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
