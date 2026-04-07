const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seasonpulse.fun";

const CONTENT = `# SeasonPulse

> Track active seasons, leagues, ladders, wipes, and cycles for popular games.

SeasonPulse provides real-time countdown timers, start and end dates, and upcoming resets for games like Diablo 4, Path of Exile, Last Epoch, and more.

## Pages

- Home: ${SITE_URL}/en
- Game tracker: ${SITE_URL}/en/game/{gameId}
- Season countdown: ${SITE_URL}/en/countdown/{gameId}

## Supported languages

English (en), Ukrainian (ua), Spanish (es), Polish (pl), German (de), French (fr)
`;

export async function GET() {
  return new Response(CONTENT, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
