/**
 * Central game data loader.
 * To add a new game: create src/data/games/<id>.json and import it here.
 */

import type { GameConfig, ManualSeasonEntry, GameSeasons } from "@/types";

import diablo4 from "./games/diablo4.json";
import diablo2r from "./games/diablo2r.json";
import poe1 from "./games/poe1.json";
import poe2 from "./games/poe2.json";
import lastepoch from "./games/lastepoch.json";
import torchlight_infinite from "./games/torchlight_infinite.json";
import undecember from "./games/undecember.json";
import the_division_2 from "./games/the_division_2.json";
import lost_ark from "./games/lost_ark.json";
import arc_raiders from "./games/arc_raiders.json";
import warframe from "./games/warframe.json";
import cs2 from "./games/cs2.json";
import marathon from "./games/marathon.json";
import overwatch from "./games/overwatch.json";
import battlefield_6 from "./games/battlefield_6.json";
import call_of_duty from "./games/call_of_duty.json";
import marvel_rivals from "./games/marvel_rivals.json";
import delta_force from "./games/delta_force.json";
import apex_legends from "./games/apex_legends.json";
import destiny_2 from "./games/destiny_2.json";

type GameFileEntry = GameConfig & { seasons: ManualSeasonEntry[] };

const ALL_GAMES = [
  diablo4,
  diablo2r,
  poe1,
  poe2,
  destiny_2,
  lastepoch,
  torchlight_infinite,
  apex_legends,
  delta_force,
  undecember,
  marvel_rivals,
  the_division_2,
  call_of_duty,
  lost_ark,
  cs2,
  overwatch,
  battlefield_6,
  marathon,
  arc_raiders,
  warframe,
] as unknown as GameFileEntry[];

export const GAMES: GameConfig[] = ALL_GAMES.map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ seasons: _s, ...cfg }) => cfg as GameConfig,
);

export const GAMES_BY_ID: Record<string, GameConfig> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
);

export function getGame(id: string): GameConfig | undefined {
  return GAMES_BY_ID[id];
}

export const GAME_SEASONS: GameSeasons[] = ALL_GAMES.map((g) => ({
  gameId: g.id,
  seasons: g.seasons,
}));
