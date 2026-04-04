import { getGame } from "@/config/games";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seasonpulse.fun";

interface Redirect {
  url: string;
  utm: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };
}

export const REDIRECTS: Record<string, Redirect> = {
  x: {
    url: SITE,
    utm: { source: "x", medium: "profile", campaign: "seasonpulse" },
  },
  twitter: {
    url: SITE,
    utm: { source: "x", medium: "profile", campaign: "seasonpulse" },
  },
  launch: {
    url: SITE,
    utm: { source: "x", medium: "social", campaign: "launch", content: "intro" },
  },
  reddit: {
    url: SITE,
    utm: { source: "reddit", medium: "social", campaign: "seasonpulse" },
  },
  discord: {
    url: SITE,
    utm: { source: "discord", medium: "social", campaign: "seasonpulse" },
  },
};

function buildUrl(entry: Redirect): string {
  const url = new URL(entry.url);
  url.searchParams.set("utm_source", entry.utm.source);
  url.searchParams.set("utm_medium", entry.utm.medium);
  url.searchParams.set("utm_campaign", entry.utm.campaign);
  if (entry.utm.content) url.searchParams.set("utm_content", entry.utm.content);
  if (entry.utm.term) url.searchParams.set("utm_term", entry.utm.term);
  return url.toString();
}

export async function resolveRedirect(segments: string[]): Promise<string | null> {
  if (segments.length === 1) {
    const [slug] = segments;

    const explicit = REDIRECTS[slug];
    if (explicit) return buildUrl(explicit);

    const game = await getGame(slug);
    if (game) {
      return buildUrl({
        url: `${SITE}/game/${game.id}`,
        utm: { source: "link", medium: "social", campaign: "seasonpulse", content: game.id },
      });
    }
  }

  if (segments.length === 2) {
    const [source, gameId] = segments;
    const game = await getGame(gameId);
    if (game) {
      return buildUrl({
        url: `${SITE}/game/${game.id}`,
        utm: { source, medium: "social", campaign: "seasonpulse", content: game.id },
      });
    }
  }

  return null;
}
