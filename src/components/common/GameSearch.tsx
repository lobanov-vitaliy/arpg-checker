"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface GameSearchItem {
  id: string;
  name: string;
  glowColor: string;
}

interface GameSearchProps {
  games: GameSearchItem[];
  selectedGames: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export function GameSearch({
  games,
  selectedGames,
  onToggle,
  onClear,
}: GameSearchProps) {
  const tFilter = useTranslations("filter");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = games.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedList = games.filter((g) => selectedGames.includes(g.id));

  return (
    <div ref={wrapperRef} className="flex flex-wrap items-center gap-2 mb-6">
      {selectedList.map((game) => (
        <button
          key={game.id}
          onClick={() => onToggle(game.id)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
          style={{
            backgroundColor: `${game.glowColor}20`,
            borderColor: `${game.glowColor}50`,
            color: game.glowColor,
          }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: game.glowColor }}
          />
          {game.name}
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/5 bg-gray-900/60 backdrop-blur-md text-gray-400 hover:text-gray-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          {tFilter("search")}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-30 w-64 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
            <div className="p-2 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tFilter("search")}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {selectedGames.length > 0 && (
                <button
                  onClick={() => {
                    onClear();
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 transition-colors"
                >
                  {tFilter("all")}
                </button>
              )}

              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-600">
                  {tFilter("noResults")}
                </p>
              ) : (
                filtered.map((game) => {
                  const selected = selectedGames.includes(game.id);
                  return (
                    <button
                      key={game.id}
                      onClick={() => {
                        onToggle(game.id);
                        setQuery("");
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-gray-800/60"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border"
                        style={{
                          backgroundColor: selected ? game.glowColor : "transparent",
                          borderColor: game.glowColor,
                        }}
                      />
                      <span
                        style={{ color: selected ? game.glowColor : "#9ca3af" }}
                      >
                        {game.name}
                      </span>
                      {selected && <span className="ml-auto text-gray-600">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {selectedGames.length > 0 && (
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline"
        >
          {tFilter("all")}
        </button>
      )}
    </div>
  );
}
