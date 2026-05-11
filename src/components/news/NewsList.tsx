"use client";

import { useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { NewsGrid } from "./NewsGrid";
import { GameSearch, type GameSearchItem } from "@/components/common/GameSearch";
import type { MultiGameNewsItem } from "@/lib/steam-news";

interface NewsListProps {
  items: MultiGameNewsItem[];
  games: GameSearchItem[];
  locale: string;
}

function NewsListInner({ items, games, locale }: NewsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedGames, setSelectedGames] = useState<string[]>(
    () => searchParams.get("game")?.split(",").filter(Boolean) ?? [],
  );

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

  const filtered =
    selectedGames.length > 0
      ? items.filter((i) => selectedGames.includes(i.gameId))
      : items;

  // Only show games that actually have news in the dropdown.
  const availableGames = games.filter((g) =>
    items.some((i) => i.gameId === g.id),
  );

  return (
    <>
      <GameSearch
        games={availableGames}
        selectedGames={selectedGames}
        onToggle={toggleGame}
        onClear={clearGames}
      />
      <NewsGrid items={filtered} locale={locale} />
    </>
  );
}

export function NewsList(props: NewsListProps) {
  return (
    <Suspense fallback={<NewsGrid items={props.items} locale={props.locale} />}>
      <NewsListInner {...props} />
    </Suspense>
  );
}
