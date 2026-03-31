/**
 * Manual season data — edit this file to update season info.
 * Add new seasons to the START of each game's array (newest first).
 *
 * Rules:
 * - endDate: null means no announced end
 * - nextSeasonStartDate: only set if officially announced, otherwise code estimates from avg duration
 * - confidence: "high" = official, "medium" = community, "low" = uncertain
 */

export interface ManualSeasonEntry {
  seasonName: string;
  seasonNumber?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  nextSeasonStartDate?: string; // YYYY-MM-DD — only if officially announced
  description?: string;
  sourceUrl?: string;
  confidence: "high" | "medium" | "low";
}

export interface GameSeasons {
  gameId: string;
  seasons: ManualSeasonEntry[]; // newest first
}

export const GAME_SEASONS: GameSeasons[] = [
  {
    gameId: "diablo4",
    seasons: [
      {
        seasonName: "Season of the Malignant",
        seasonNumber: 1,
        startDate: "2023-07-20",
        endDate: "2023-10-17",
        description:
          "The first Diablo IV season introduced Malignant Hearts, a new seasonal questline, battle pass, and corrupted enemies spreading through Sanctuary.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23976339/season-of-the-malignant-now-live",
        confidence: "high",
      },
      {
        seasonName: "Season of Blood",
        seasonNumber: 2,
        startDate: "2023-10-17",
        endDate: "2024-01-23",
        description:
          "Season 2 centered on vampiric powers, a vampire-hunting storyline, Blood Harvest activities, and new endgame bosses.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24009152/bite-down-on-darkness-in-season-of-blood",
        confidence: "high",
      },
      {
        seasonName: "Season of the Construct",
        seasonNumber: 3,
        startDate: "2024-01-23",
        endDate: "2024-05-14",
        description:
          "Season 3 sent players beneath Kehjistan to confront demonic constructs, featuring the Seneschal Companion and Vault-themed seasonal content.",
        sourceUrl:
          "https://news.blizzard.com/en-us/diablo4/24053482/unearth-a-looming-threat-in-season-of-the-construct",
        confidence: "high",
      },
      {
        seasonName: "Loot Reborn",
        seasonNumber: 4,
        startDate: "2024-05-14",
        endDate: "2024-08-06",
        description:
          "Season 4 overhauled itemization with Tempering and Masterworking, revamped Helltides, and focused on permanent loot-system improvements.",
        sourceUrl:
          "https://news.blizzard.com/en-gb/article/24077223/galvanize-your-legend-in-season-4-loot-reborn",
        confidence: "high",
      },
      {
        seasonName: "Season of the Infernal Hordes",
        seasonNumber: 5,
        startDate: "2024-08-06",
        endDate: "2024-10-07",
        description:
          "Season 5 added Infernal Hordes, a wave-based endgame activity, alongside a new seasonal questline and more hell-themed combat rewards.",
        sourceUrl:
          "https://news.blizzard.com/en-gb/article/24119591/slay-endless-demons-in-season-of-the-infernal-hordes",
        confidence: "high",
      },
      {
        seasonName: "Season of Hatred Rising",
        seasonNumber: 6,
        startDate: "2024-10-07",
        endDate: "2025-01-21",
        description:
          "Season 6 launched alongside Vessel of Hatred and focused on escalating Mephisto’s influence with new seasonal progression and monstrous threats.",
        sourceUrl:
          "https://news.blizzard.com/en-us/diablo4/24140803/conquer-colossal-foes-in-season-of-hatred-rising",
        confidence: "high",
      },
      {
        seasonName: "Season of Witchcraft",
        seasonNumber: 7,
        startDate: "2025-01-21",
        endDate: "2025-04-29",
        description:
          "Season 7 revolved around Witchcraft powers, Headrotten enemies, occult upgrades, and a new mystery tied to the Tree of Whispers.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24167111/master-the-occult-in-season-of-witchcraft",
        confidence: "high",
      },
      {
        seasonName: "Belial's Return",
        seasonNumber: 8,
        startDate: "2025-04-29",
        endDate: "2025-07-01",
        description:
          "Season 8 brought Belial back into the spotlight with Boss Powers, Apparition Monsters, and a deception-focused seasonal storyline.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24189530/combat-deception-in-season-8-belials-return",
        confidence: "high",
      },
      {
        seasonName: "Sins of the Horadrim",
        seasonNumber: 9,
        startDate: "2025-07-01",
        endDate: "2025-09-23",
        description:
          "Season 9 introduced Horadric Spellcraft, Blood Relics, and a questline about uncovering and cleansing ancient Horadric corruption.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24215863/purge-the-sins-of-the-horadrim",
        confidence: "high",
      },
      {
        seasonName: "Infernal Chaos",
        seasonNumber: 10,
        startDate: "2025-09-23",
        endDate: "2025-12-11",
        description:
          "Season 10 focused on Chaos Armor, Chaos Perks, Chaos Rifts, and a renewed Infernal Hordes experience as hell spilled further into Sanctuary.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24226702/rally-against-hell-in-season-of-infernal-chaos",
        confidence: "high",
      },
      {
        seasonName: "Divine Intervention",
        seasonNumber: 11,
        startDate: "2025-12-11",
        endDate: "2026-03-11",
        description:
          "Season 11 introduced Divine Gifts, the return of the Lesser Evils, itemization changes, Season Rank, and angelic aid against Hell.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24244465/vanquish-the-lesser-evils-in-season-of-divine-intervention",
        confidence: "high",
      },
      {
        seasonName: "Season of Slaughter",
        seasonNumber: 12,
        startDate: "2026-03-11",
        endDate: null,
        description:
          "Season 12 is the current season and adds Butcher transformation mechanics, Killstreak progression, Bloodied Items, and Slaughterhouse activities.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24244648/become-the-butcher-in-season-of-slaughter",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "diablo2r",
    seasons: [
      {
        seasonName: "Ladder Season 1",
        seasonNumber: 1,
        startDate: "2022-04-28",
        endDate: "2022-10-06",
        description:
          "The first competitive Ladder season in Diablo II: Resurrected launched with Patch 2.4 and introduced the ranked race to Level 99 across multiple Ladder modes.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23788293/diablo-ii-resurrected-patch-2-4-ladder-now-live",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 2",
        seasonNumber: 2,
        startDate: "2022-10-06",
        endDate: "2023-02-16",
        description:
          "Season 2 was the first Ladder season with Terror Zones and continued the Level 99 race with fresh Ladder characters and reset leaderboards.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23827590/diablo-ii-resurrected-ladder-season-two-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 3",
        seasonNumber: 3,
        startDate: "2023-02-16",
        endDate: "2023-05-04",
        description:
          "Season 3 refreshed the Ladder with new rune word support and updates tied to Patch 2.6 while preserving the classic competitive reset format.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23899624/diablo-ii-resurrected-ladder-season-three-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 4",
        seasonNumber: 4,
        startDate: "2023-05-04",
        endDate: "2023-09-28",
        description:
          "Season 4 continued the regular Ladder reset cadence, giving players a fresh start and another leaderboard race in all standard Ladder variants.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23938388/diablo-ii-resurrected-ladder-season-4-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 5",
        seasonNumber: 5,
        startDate: "2023-09-28",
        endDate: "2024-02-22",
        description:
          "Season 5 reset the Ladder again and kept the core Diablo II competitive formula focused on speed-leveling, loot progression, and leaderboard placement.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/23991801/diablo-ii-resurrected-ladder-season-5-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 6",
        seasonNumber: 6,
        startDate: "2024-02-22",
        endDate: "2024-05-23",
        description:
          "Season 6 offered another full Ladder reset with the familiar seasonal race to Level 99 across Standard, Hardcore, and their expansion variants.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24061888/diablo-ii-resurrected-ladder-season-6-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 7",
        seasonNumber: 7,
        startDate: "2024-05-23",
        endDate: "2024-08-23",
        description:
          "Season 7 launched after Patch 2.7.3 and continued Diablo II: Resurrected's recurring Ladder format with a fresh economy and leaderboard reset.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24096018/diablo-ii-resurrected-ladder-season-7-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 8",
        seasonNumber: 8,
        startDate: "2024-08-23",
        endDate: "2024-12-06",
        description:
          "Season 8 maintained the established Ladder structure, offering another reset for players chasing top rankings, loot, and optimized leveling routes.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24111638/diablo-ii-resurrected-ladder-season-8-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 9",
        seasonNumber: 9,
        startDate: "2024-12-06",
        endDate: "2025-03-07",
        description:
          "Season 9 arrived with Patch 2.8.0 and continued the traditional Ladder reset with a new opportunity to race to Level 99 and rebuild from scratch.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24158875/diablo-ii-resurrected-ladder-season-9-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 10",
        seasonNumber: 10,
        startDate: "2025-03-07",
        endDate: "2025-06-20",
        description:
          "Season 10 reset all Ladder rankings again, preserving the classic seasonal structure of fresh characters, a reset economy, and leaderboard competition.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24179243/diablo-ii-resurrected-ladder-season-10-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 11",
        seasonNumber: 11,
        startDate: "2025-06-20",
        endDate: "2025-10-03",
        description:
          "Season 11 continued the recurring Ladder cycle, bringing another leaderboard reset and another fresh start for optimized progression routes.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24208340/diablo-ii-resurrected-ladder-season-11-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 12",
        seasonNumber: 12,
        startDate: "2025-10-03",
        endDate: "2026-02-20",
        description:
          "Season 12 was the final completed Ladder season before the current reset, maintaining the same multi-mode competitive race and seasonal reset structure.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24226703/diablo-ii-resurrected-ladder-season-12-has-concluded",
        confidence: "high",
      },
      {
        seasonName: "Ladder Season 13",
        seasonNumber: 13,
        startDate: "2026-02-20",
        endDate: null,
        description:
          "The current Ladder season gives players a fresh reset to race to Level 99 again, with all standard Diablo II: Resurrected Ladder modes available.",
        sourceUrl:
          "https://news.blizzard.com/en-us/article/24246296/diablo-ii-resurrected-ladder-season-13-now-live",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "poe1",
    seasons: [
      {
        seasonName: "Necropolis",
        seasonNumber: 1,
        startDate: "2024-03-29",
        endDate: "2024-07-26",
        description:
          "The Necropolis challenge league introduced the Lantern of Arimor, corpse crafting, haunted modifiers, and a graveyard-based item creation system.",
        sourceUrl: "https://www.pathofexile.com/necropolis",
        confidence: "high",
      },
      {
        seasonName: "Settlers of Kalguur",
        seasonNumber: 2,
        startDate: "2024-07-26",
        endDate: "2025-06-13",
        description:
          "This challenge league focused on building Kingsmarch, managing workers and trade, upgrading the town, and progressing through a settlement-driven economy system.",
        sourceUrl: "https://www.pathofexile.com/settlers",
        confidence: "high",
      },
      {
        seasonName: "Mercenaries",
        seasonNumber: 3,
        startDate: "2025-06-13",
        endDate: "2025-10-31",
        description:
          "The Mercenaries challenge league launched with Secrets of the Atlas and added recruitable mercenaries, Memory-influenced mapping, and major Atlas endgame updates.",
        sourceUrl:
          "https://www.pathofexile.com/secrets-of-the-atlas-patch-notes",
        confidence: "high",
      },
      {
        seasonName: "Keepers of the Flame",
        seasonNumber: 4,
        startDate: "2025-10-31",
        endDate: "2026-03-06",
        description:
          "Keepers of the Flame added unstable and hive breaches, the Genesis Tree, graft-based rewards, and a Breach-focused challenge league system.",
        sourceUrl: "https://www.pathofexile.com/keepers",
        confidence: "high",
      },
      {
        seasonName: "Mirage",
        seasonNumber: 5,
        startDate: "2026-03-06",
        endDate: null,
        description:
          "The current Mirage challenge league features Djinn encounters, astral hazards, Afarud enemies, and league content centered around entering and clearing mirrored battle spaces.",
        sourceUrl: "https://www.pathofexile.com/mirage",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "poe2",
    seasons: [
      {
        seasonName: "Dawn of the Hunt",
        seasonNumber: 1,
        startDate: "2025-04-04",
        endDate: "2025-08-29",
        description:
          "A major Path of Exile 2 content update that introduced Dawn of the Hunt league content, the Huntress class, new Ascendancies, and expanded endgame systems.",
        sourceUrl: "https://pathofexile2.com/hunt",
        confidence: "high",
      },
      {
        seasonName: "Rise of the Abyssal",
        seasonNumber: 2,
        startDate: "2025-08-29",
        endDate: "2025-12-12",
        description:
          "The league introduced in The Third Edict update, featuring Abyss-themed content, Act Four, new uniques, and major endgame changes.",
        sourceUrl: "https://pathofexile2.com/edict",
        confidence: "high",
      },
      {
        seasonName: "The Last of the Druids",
        seasonNumber: 3,
        startDate: "2025-12-12",
        endDate: null,
        description:
          "The current Path of Exile 2 league, introduced in The Last of the Druids update, focused on Atziri, Vaal content, and new progression systems.",
        sourceUrl: "https://pathofexile2.com/druids",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "lastepoch",
    seasons: [
      {
        seasonName: "Cycle 1.0",
        seasonNumber: 1,
        startDate: "2024-02-21",
        endDate: "2024-07-09",
        description:
          "The first Last Epoch Cycle launched with version 1.0 and introduced Item Factions, the Warlock and Falconer masteries, and the full 1.0 release environment.",
        sourceUrl:
          "https://forum.lastepoch.com/t/last-epoch-1-0-patch-notes/62536",
        confidence: "high",
      },
      {
        seasonName: "Harbingers of Ruin",
        seasonNumber: 2,
        startDate: "2024-07-09",
        endDate: "2025-04-17",
        description:
          "This cycle introduced Harbingers, Aberroth as a pinnacle encounter, new endgame content, faction updates, and major quality-of-life improvements.",
        sourceUrl:
          "https://forum.lastepoch.com/t/last-epoch-harbingers-of-ruin-patch-notes/71790",
        confidence: "high",
      },
      {
        seasonName: "Tombs of the Erased",
        seasonNumber: 3,
        startDate: "2025-04-17",
        endDate: "2025-08-21",
        description:
          "Season 2 added Tombs and Cemeteries of the Erased, Legendary crafting updates, Weaver faction content, champion enemies, and broad system changes.",
        sourceUrl:
          "https://forum.lastepoch.com/t/last-epoch-tombs-of-the-erased-patch-notes/75247",
        confidence: "high",
      },
      {
        seasonName: "Beneath Ancient Skies",
        seasonNumber: 4,
        startDate: "2025-08-21",
        endDate: "2026-03-26",
        description:
          "Season 3 introduced dinosaur-themed content, new encounters, new progression and loot additions, and a large seasonal update built around primal ancient threats.",
        sourceUrl:
          "https://forum.lastepoch.com/t/last-epoch-beneath-ancient-skies-patch-notes/78635",
        confidence: "high",
      },
      {
        seasonName: "Shattered Omens",
        seasonNumber: 5,
        startDate: "2026-03-26",
        endDate: null,
        description:
          "The current Last Epoch season adds Omen Windows, corruption-focused item systems, new loot, class updates, and wider quality-of-life improvements.",
        sourceUrl:
          "https://forum.lastepoch.com/t/last-epoch-shattered-omens-patch-notes/80571",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "torchlight_infinite",
    seasons: [
      {
        seasonName: "Cube of Rapacity",
        seasonNumber: 1,
        startDate: "2023-05-09",
        endDate: "2023-09-08",
        description:
          "The first officially numbered global season introduced the Cube of Rapacity mechanic, letting hunters gamble rewards for higher risk and higher value returns.",
        sourceUrl:
          "https://store.steampowered.com/news/app/1974050/view/3705943193620059259",
        confidence: "high",
      },
      {
        seasonName: "The City of Aeterna",
        seasonNumber: 2,
        startDate: "2023-09-08",
        endDate: "2023-12-28",
        description:
          "This season opened the ruins of Aeterna, adding a new city-themed progression path, exclusive encounters, and season-specific exploration rewards.",
        sourceUrl: "https://torchlight.xd.com/pt/news/single?id=22963",
        confidence: "high",
      },
      {
        seasonName: "Twinightmare",
        seasonNumber: 3,
        startDate: "2023-12-28",
        endDate: "2024-04-18",
        description:
          "Twinightmare brought dream and nightmare-themed gameplay, new progression systems, and Rosa as a new hero focused on durable holy combat.",
        sourceUrl: "https://torchlight.xd.com/en/ep5/",
        confidence: "high",
      },
      {
        seasonName: "Whispering Mist",
        seasonNumber: 4,
        startDate: "2024-04-18",
        endDate: "2024-07-04",
        description:
          "This season introduced Mistville and activation-medium-based progression, adding new build experimentation and mist-themed endgame content.",
        sourceUrl: "https://torchlight.xd.com/en/ep6/",
        confidence: "high",
      },
      {
        seasonName: "Clockwork Ballet",
        seasonNumber: 5,
        startDate: "2024-07-04",
        endDate: "2024-10-24",
        description:
          "Clockwork Ballet reworked crafting and endgame progression, added new clockwork-themed activities, and expanded high-level customization.",
        sourceUrl: "https://torchlight.xd.com/en/ep7",
        confidence: "high",
      },
      {
        seasonName: "Frozen Canvas",
        seasonNumber: 6,
        startDate: "2024-10-24",
        endDate: "2025-01-09",
        description:
          "Frozen Canvas added an icy artistic seasonal mechanic, a new hero form for Selena, and broad overhauls to systems and progression.",
        sourceUrl: "https://torchlight.xd.com/us/ep8",
        confidence: "high",
      },
      {
        seasonName: "Arcana",
        seasonNumber: 7,
        startDate: "2025-01-09",
        endDate: "2025-04-17",
        description:
          "Arcana introduced tarot-themed trials, notes of destiny, and a path-based seasonal system focused on fate, risk, and reward.",
        sourceUrl:
          "https://steamcommunity.com/games/1974050/announcements/detail/545596070177013766",
        confidence: "high",
      },
      {
        seasonName: "Sandlord",
        seasonNumber: 8,
        startDate: "2025-04-17",
        endDate: "2025-07-17",
        description:
          "Sandlord launched with the Cloud Oasis mechanic, floating island management, mercenary raiding, blending systems, and anniversary rewards.",
        sourceUrl: "https://torchlight.xd.com/us/ep10",
        confidence: "high",
      },
      {
        seasonName: "Outlaw",
        seasonNumber: 9,
        startDate: "2025-07-17",
        endDate: "2025-10-10",
        description:
          "Outlaw centered on high-risk convoy heists, black market contraband, and the TOWER Sequence progression system for weapons and shields.",
        sourceUrl: "https://torchlight.xd.com/en/ep11",
        confidence: "high",
      },
      {
        seasonName: "Overrealm",
        seasonNumber: 10,
        startDate: "2025-10-10",
        endDate: "2026-01-15",
        description:
          "Overrealm added anomaly-filled extra realms, prism-based talent customization, and a new layer of roguelike progression in the Netherrealm.",
        sourceUrl:
          "https://store.steampowered.com/news/app/1974050/view/545621427784515708",
        confidence: "high",
      },
      {
        seasonName: "Vorax",
        seasonNumber: 11,
        startDate: "2026-01-15",
        endDate: null,
        description:
          "The current season introduces the Vorax plague mechanic, surgical monster modification, graft-based gear customization, and Erika's new trait.",
        sourceUrl:
          "https://store.steampowered.com/news/app/1974050/view/521985143331621000",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "arc_raiders",
    seasons: [
      {
        seasonName: "Launch Cycle",
        seasonNumber: 1,
        startDate: "2025-10-30",
        endDate: "2025-12-22",
        description:
          "The initial ARC Raiders progression cycle from launch until the first Expedition departure window closed. Players built toward the Expedition Project and could choose their first voluntary reset.",
        sourceUrl:
          "https://arcraiders.com/news/the-expedition-project-is-departing-soon",
        confidence: "medium",
      },
      {
        seasonName: "First Expedition Cycle",
        seasonNumber: 2,
        startDate: "2025-12-22",
        endDate: "2026-03-01",
        description:
          "The cycle after the first Expedition departure, during which players progressed toward their second voluntary wipe/reset and stacked Expedition rewards and buffs.",
        sourceUrl:
          "https://arcraiders.com/news/second-expedition-rewards-and-requirements",
        confidence: "medium",
      },
      {
        seasonName: "Second Expedition Cycle",
        seasonNumber: 3,
        startDate: "2026-03-01",
        endDate: null,
        description:
          "The current ARC Raiders reset cycle following the second Expedition departure. It continues the game's optional wipe-based progression model rather than an official season system.",
        sourceUrl:
          "https://arcraiders.com/news/second-expedition-rewards-and-requirements",
        confidence: "medium",
      },
    ],
  },
  {
    gameId: "undecember",
    seasons: [
      {
        seasonName: "Re:Birth",
        seasonNumber: 1,
        startDate: "2024-11-07",
        endDate: "2025-01-09",
        description:
          "The first officially named Undecember season introduced Re:Birth Mode and marked the start of the new unique-name season format instead of the previous numbering system.",
        sourceUrl:
          "https://ud.floor.line.games/us/bbsCmn/detail/1730901162975031522",
        confidence: "high",
      },
      {
        seasonName: "Trials of Power",
        seasonNumber: 2,
        startDate: "2025-01-09",
        endDate: "2025-05-02",
        description:
          "This season followed Re:Birth, resetting Void Rift progression and adding a new season-focused competitive cycle built around Trials of Power content.",
        sourceUrl:
          "https://ud.floor.line.games/us/bbsCmn/detail/1736760579410018644",
        confidence: "high",
      },
      {
        seasonName: "Starwalker",
        seasonNumber: 3,
        startDate: "2025-05-02",
        endDate: "2025-09-04",
        description:
          "Season Starwalker added a new Season Mode cycle with its own gear, pass rewards, raid schedule, and season-limited progression systems.",
        sourceUrl:
          "https://ud.floor.line.games/us/bbsCmn/detail/1746187599491003314",
        confidence: "high",
      },
      {
        seasonName: "Abyss Gate",
        seasonNumber: 4,
        startDate: "2025-09-04",
        endDate: "2026-01-15",
        description:
          "Abyss Gate centered on descending through Chaos Statue-linked dungeon depths with progressively stronger monsters and season-exclusive progression.",
        sourceUrl:
          "https://ud.floor.line.games/us/bbsCmn/detail/1755844453621021669",
        confidence: "high",
      },
      {
        seasonName: "New Age",
        seasonNumber: 5,
        startDate: "2026-01-15",
        endDate: null,
        description:
          "The current Undecember season focuses on a large-scale skill overhaul, Season Mode progression through Abyss Gate New Age, and season-specific rewards and passes.",
        sourceUrl:
          "https://ud.floor.line.games/us/bbsCmn/detail/1766123994211003441",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "the_division_2",
    seasons: [
      {
        seasonName: "Broken Wings",
        seasonNumber: 1,
        startDate: "2023-06-09",
        endDate: "2023-10-03",
        description:
          "The first season of Year 5 launched alongside the new Descent mode, a new Manhunt structure, fresh gear, exotics, and vanity rewards.",
        sourceUrl:
          "https://www.ubisoft.com/en-gb/game/the-division/the-division-2/news-updates/2ds4tuZY2fS5x4qSzfmqjX/year-5-season-1-broken-wings",
        confidence: "high",
      },
      {
        seasonName: "Puppeteers",
        seasonNumber: 2,
        startDate: "2023-10-03",
        endDate: "2024-02-27",
        description:
          "Year 5 Season 2 introduced the Incursion at Meret Estate, new exotic rewards, seasonal gear, and the next chapter of the seasonal manhunt.",
        sourceUrl:
          "https://www.ubisoft.com/en-us/game/the-division/the-division-2/news-updates/1yBARPbXSYwkKmgCPyqHWa/year-5-season-2-puppeteers",
        confidence: "high",
      },
      {
        seasonName: "Vanguard",
        seasonNumber: 3,
        startDate: "2024-02-27",
        endDate: "2024-06-11",
        description:
          "Year 5 Season 3 brought a Kelso-focused manhunt, new gear, apparel events, and a major gameplay improvement update tied to Project Resolve.",
        sourceUrl:
          "https://www.ubisoft.com/pl-pl/game/the-division/the-division-2/news-updates/4Q5mYbSvaH9H3YZtMiraHs/year-5-season-3-vanguard",
        confidence: "high",
      },
      {
        seasonName: "First Rogue",
        seasonNumber: 4,
        startDate: "2024-06-11",
        endDate: "2024-10-29",
        description:
          "Year 6 Season 1 unified the endgame for The Division 2 owners, raised all players into the same level-40 endgame path, and continued the Keener storyline.",
        sourceUrl:
          "https://www.ubisoft.com/en-gb/game/the-division/the-division-2/news-updates/9XK0DbaxzntoNxXqC5ftY/year-6-season-1-first-rogue",
        confidence: "high",
      },
      {
        seasonName: "Shades of Red",
        seasonNumber: 5,
        startDate: "2024-10-29",
        endDate: "2025-02-25",
        description:
          "Year 6 Season 2 started a new seasonal journey around Keener’s captured network, including new manhunt targets, rewards, and seasonal progression.",
        sourceUrl:
          "https://www.ubisoft.com/en-ca/game/the-division/the-division-2/news-updates/6xHUrSJ9z828rDyJSwzG2V/year-6-season-2-shades-of-red",
        confidence: "high",
      },
      {
        seasonName: "Burden of Truth",
        seasonNumber: 6,
        startDate: "2025-02-25",
        endDate: "2025-12-02",
        description:
          "Year 6 Season 3 followed Agents searching for Kelso, expanding the manhunt storyline with a new season pass, narrative progression, and new gear.",
        sourceUrl:
          "https://www.ubisoft.com/en-us/game/the-division/the-division-2/news-updates/5V9sBiXBdAwdb9Migm4zZW/year-6-season-3-burden-of-truth",
        confidence: "medium",
      },
      {
        seasonName: "Mutiny",
        seasonNumber: 7,
        startDate: "2025-12-02",
        endDate: "2026-03-03",
        description:
          "Mutiny introduced recruitable True Sons defectors as Companions through the Command Link system, along with new threats, equipment, and a Master Climax Mission.",
        sourceUrl:
          "https://www.ubisoft.com/en-us/game/the-division/the-division-2/news-updates/5fLsSWyLeFsYWiBxlByY4K/the-division-2-mutiny",
        confidence: "high",
      },
      {
        seasonName: "Anniversary Season",
        seasonNumber: 8,
        startDate: "2026-03-03",
        endDate: null,
        description:
          "A special anniversary season celebrating 10 years of The Division with Realism Mode, returning Global Events, a themed Event Pass, special rewards, and visual improvements.",
        sourceUrl:
          "https://www.ubisoft.com/en-us/game/the-division/the-division-2/news-updates/1myuMJ5wGJFqIy2ic0mYnp/celebrating-10-years-of-the-division",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "lost_ark",
    seasons: [
      {
        seasonName: "Paradise Season 1",
        seasonNumber: 1,
        startDate: "2025-12-10",
        endDate: "2026-03-04",
        description:
          "The first Paradise season introduced the new Paradise progression system with Elysian, Crucible, and Hell, creating a repeatable seasonal loop with Hell Keys, gear progression, and reset-based rewards.",
        sourceUrl:
          "https://www.playlostark.com/en-us/game/releases/welcome-to-paradise",
        confidence: "medium",
      },
      {
        seasonName: "Paradise Season 2",
        seasonNumber: 2,
        startDate: "2026-01-14",
        endDate: "2026-03-11",
        description:
          "The second Paradise season continued the seasonal progression loop and was later adjusted based on feedback, with Amazon explicitly warning players to use remaining Hell Keys before the season ended.",
        sourceUrl:
          "https://www.playlostark.com/en-gb/news/articles/team-update-heading-toward-march",
        confidence: "medium",
      },
      {
        seasonName: "Paradise Season 3",
        seasonNumber: 3,
        startDate: "2026-03-11",
        endDate: null,
        description:
          "The current Paradise season launched with the Ends of the Abyss update and continues Lost Ark's repeatable Paradise system with seasonal progression, Hell Keys, and updated reward and balance rules.",
        sourceUrl:
          "https://www.playlostark.com/en-us/game/releases/ends-of-the-abyss",
        confidence: "high",
      },
    ],
  },
  {
    gameId: "warframe",
    seasons: [
      {
        seasonName: "Nora's Mix Vol. 6",
        seasonNumber: 1,
        startDate: "2024-05-15",
        endDate: "2024-09-03",
        description:
          "A Daybreak-themed Nightwave season with new cosmetics, Cred rewards, Acts, and the usual Nightwave progression reset.",
        sourceUrl:
          "https://www.warframe.com/en/news/nightwave-mix-da-nora-vol-6",
        confidence: "high",
      },
      {
        seasonName: "Nora's Mix Vol. 7",
        seasonNumber: 2,
        startDate: "2024-09-03",
        endDate: "2025-02-06",
        description:
          "A Stalker-themed Nightwave season featuring darker rewards, new cosmetics, and a fresh set of Acts and Cred offerings.",
        sourceUrl: "https://www.warframe.com/en/news/nightwave-noras-mix-vol-7",
        confidence: "high",
      },
      {
        seasonName: "Nora's Mix Vol. 8",
        seasonNumber: 3,
        startDate: "2025-02-06",
        endDate: "2025-05-21",
        description:
          "A 1999-inspired Nightwave season with Höllvania-themed cosmetics, new rewards, and the standard Nightwave challenge loop.",
        sourceUrl: "https://www.warframe.com/en/news/nightwave-noras-mix-vol-8",
        confidence: "high",
      },
      {
        seasonName: "Nora's Mix Vol. 9",
        seasonNumber: 4,
        startDate: "2025-05-21",
        endDate: "2025-10-27",
        description:
          "A cosmos-themed Nightwave season with celestial cosmetics, Nora's Mix Vol. 9 Cred, and a new rotation of Nightwave rewards.",
        sourceUrl:
          "https://www.warframe.com/en/news/nightwave-noras-mix-vol-9-arrives-may-21",
        confidence: "high",
      },
      {
        seasonName: "Dreams of the Dead",
        seasonNumber: 5,
        startDate: "2025-10-27",
        endDate: null,
        description:
          "The current Nightwave season, themed around Day of the Dead-inspired rewards, haunting cosmetics, and the standard Acts-based seasonal progression.",
        sourceUrl:
          "https://www.warframe.com/en/news/nightwave-dreams-of-the-dead-arrives-october-27",
        confidence: "high",
      },
    ],
  },
];
