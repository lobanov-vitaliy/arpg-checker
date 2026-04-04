import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  const secret = process.env.CRON_SECRET;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { gameName?: string };
  if (!body.gameName) {
    return NextResponse.json({ error: "gameName required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are a game data assistant. Today is ${today}.
Research the game: "${body.gameName}"

Search the web for details. Return ONLY valid JSON (no markdown):
{
  "name": "full official game name",
  "shortName": "short name max 12 chars",
  "developer": "developer/publisher",
  "seasonType": "season" | "ladder" | "cycle" | "league" | "expedition" | "nightwave",
  "genres": ["ARPG", "Hack & Slash"],
  "officialUrl": "https://...",
  "steamAppId": 12345 or null,
  "coverImage": "https://cdn.akamai.steamstatic.com/steam/apps/{appId}/header.jpg if on Steam, else best cover image URL",
  "popularityScore": 50,
  "searchHints": ["query to find current season 1", "query 2", "query 3"],
  "accentColor": "text-orange-400",
  "accentBg": "bg-orange-400",
  "bgGradient": "from-orange-950/90 via-gray-900 to-gray-950",
  "glowColor": "#fb923c"
}

Rules:
- steamAppId: search store.steampowered.com to find it, return as number or null
- coverImage: if steamAppId found use https://cdn.akamai.steamstatic.com/steam/apps/{steamAppId}/header.jpg
- popularityScore: 0-100 based on Twitch viewers, Steam concurrent players, community size
- searchHints: generic queries (no hardcoded years/numbers) to find the game's current season/league info
- accentColor/accentBg/bgGradient/glowColor: pick a color that matches the game's visual style`;

  let response;
  try {
    response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: prompt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai-game-lookup] OpenAI error:", msg);
    return NextResponse.json({ error: `OpenAI error: ${msg}` }, { status: 500 });
  }

  const text = response.output_text;
  if (!text) {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[ai-game-lookup] No JSON in response:", text.slice(0, 300));
    return NextResponse.json({ error: `No JSON in AI response. Got: ${text.slice(0, 200)}` }, { status: 500 });
  }

  try {
    const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const id = String(data.name ?? body.gameName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return NextResponse.json({ ...data, id, seasons: [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to parse AI response: ${msg}` }, { status: 500 });
  }
}
