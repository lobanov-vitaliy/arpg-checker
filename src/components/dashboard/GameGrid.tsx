import { GameCard } from "./GameCard";
import type { GameConfig, SeasonData } from "@/types";

interface GameGridProps {
  games: GameConfig[];
  seasons: SeasonData[];
}

export function GameGrid({ games, seasons }: GameGridProps) {
  const seasonMap = Object.fromEntries(seasons.map((s) => [s.gameId, s]));

  // Sort by popularityScore descending.
  const sorted = [...games].sort((a, b) => b.popularityScore - a.popularityScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sorted.map((game) => (
        <GameCard key={game.id} game={game} season={seasonMap[game.id]} />
      ))}
    </div>
  );
}
