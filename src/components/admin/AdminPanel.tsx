"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameConfig, ManualSeasonEntry } from "@/types";
import type { FeedbackEntry } from "@/lib/feedback";
import Image from "next/image";

type GameWithSeasons = GameConfig & { seasons: ManualSeasonEntry[] };

const SEASON_TYPES = ["season", "ladder", "cycle", "league", "expedition", "nightwave"];
const CONFIDENCE = ["high", "medium", "low"];

function api(path: string, token: string, opts?: RequestInit) {
  return fetch(path, {
    ...opts,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers },
  });
}

function validateGameForm(form: Record<string, unknown>): string | null {
  const id = String(form.id ?? "").trim();
  const name = String(form.name ?? "").trim();
  const developer = String(form.developer ?? "").trim();
  const score = Number(form.popularityScore);
  const officialUrl = String(form.officialUrl ?? "").trim();

  if (!id) return "ID is required";
  if (!/^[a-z0-9-]+$/.test(id)) return "ID must be lowercase letters, numbers and hyphens only";
  if (!name || name.length < 2) return "Name must be at least 2 characters";
  if (!developer) return "Developer is required";
  if (score < 0 || score > 100) return "Popularity score must be 0–100";
  if (officialUrl && !/^https?:\/\/.+/.test(officialUrl)) return "Official URL must start with http:// or https://";
  return null;
}

function validateSeasonForm(form: ManualSeasonEntry): string | null {
  if (!form.seasonName.trim()) return "Season name is required";
  if (!form.startDate) return "Start date is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) return "Start date must be YYYY-MM-DD";
  if (form.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.endDate)) return "End date must be YYYY-MM-DD";
  if (form.endDate && form.endDate <= form.startDate) return "End date must be after start date";
  return null;
}

export function AdminPanel({ token }: { token: string }) {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [selected, setSelected] = useState<GameWithSeasons | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"games" | "seasons" | "feedback">("games");
  const [showGameForm, setShowGameForm] = useState(false);
  const [editGame, setEditGame] = useState<GameConfig | null>(null);
  const [showAiLookup, setShowAiLookup] = useState(false);
  const [aiPrefill, setAiPrefill] = useState<GameConfig | null>(null);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editSeason, setEditSeason] = useState<ManualSeasonEntry | null>(null);
  const [msg, setMsg] = useState("");
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const loadGames = useCallback(async () => {
    setLoading(true);
    const res = await api("/api/admin/games", token);
    if (res.ok) setGames(await res.json());
    setLoading(false);
  }, [token]);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    const res = await api("/api/admin/feedback", token);
    if (res.ok) setFeedback(await res.json());
    setFeedbackLoading(false);
  }, [token]);

  useEffect(() => { loadGames(); }, [loadGames]);
  useEffect(() => { if (view === "feedback") loadFeedback(); }, [view, loadFeedback]);

  async function markRead(id: string) {
    await api(`/api/admin/feedback/${id}`, token, { method: "PATCH" });
    setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, readAt: new Date().toISOString() } : f));
  }

  async function deleteFeedbackEntry(id: string) {
    if (!confirm("Delete this feedback?")) return;
    await api(`/api/admin/feedback/${id}`, token, { method: "DELETE" });
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  }

  async function selectGame(gameId: string) {
    const res = await api(`/api/admin/games/${gameId}`, token);
    if (res.ok) { setSelected(await res.json()); setView("seasons"); }
  }

  async function deleteGame(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    await api(`/api/admin/games/${id}`, token, { method: "DELETE" });
    flash(`Deleted ${id}`);
    await loadGames();
  }

  async function deleteSeason(gameId: string, startDate: string) {
    if (!confirm(`Delete season ${startDate}?`)) return;
    await api(`/api/admin/games/${gameId}/seasons/${encodeURIComponent(startDate)}`, token, { method: "DELETE" });
    flash("Season deleted");
    await selectGame(gameId);
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  const unreadCount = feedback.filter((f) => !f.readAt).length;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">SeasonPulse Admin</h1>
          {msg && <span className="text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-full">{msg}</span>}
        </div>

        {/* Nav */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <NavBtn active={view === "games"} onClick={() => { setView("games"); setSelected(null); }}>
            Games ({games.length})
          </NavBtn>
          {selected && (
            <NavBtn active={view === "seasons"} onClick={() => setView("seasons")}>
              {selected.name} — Seasons ({selected.seasons.length})
            </NavBtn>
          )}
          <NavBtn active={view === "feedback"} onClick={() => setView("feedback")}>
            Feedback{unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{unreadCount}</span>
            )}
          </NavBtn>
        </div>

        {/* Games list */}
        {view === "games" && (
          <div>
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => setShowAiLookup(true)} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                ✦ Add with AI
              </button>
              <button onClick={() => setShowGameForm(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors">
                + Add Game
              </button>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading…</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Developer</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => (
                      <tr key={g.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{g.id}</td>
                        <td className="px-4 py-3 font-medium">{g.name}</td>
                        <td className="px-4 py-3 text-gray-400">{g.developer}</td>
                        <td className="px-4 py-3 text-gray-400">{g.seasonType}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => selectGame(g.id)} className="px-3 py-1 rounded bg-white/8 hover:bg-white/15 text-xs transition-colors">Seasons</button>
                            <button onClick={() => setEditGame(g)} className="px-3 py-1 rounded bg-white/8 hover:bg-white/15 text-xs transition-colors">Edit</button>
                            <button onClick={() => deleteGame(g.id)} className="px-3 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showGameForm && (
              <GameForm
                token={token}
                initial={aiPrefill ?? undefined}
                onDone={() => { setShowGameForm(false); setAiPrefill(null); loadGames(); flash("Game added"); }}
                onCancel={() => { setShowGameForm(false); setAiPrefill(null); }}
              />
            )}
            {editGame && (
              <GameForm
                token={token}
                initial={editGame}
                onDone={() => { setEditGame(null); loadGames(); flash("Game updated"); }}
                onCancel={() => setEditGame(null)}
              />
            )}
            {showAiLookup && (
              <AiGameLookupModal
                token={token}
                onApprove={(game) => {
                  setShowAiLookup(false);
                  setAiPrefill(game);
                  setShowGameForm(true);
                }}
                onCancel={() => setShowAiLookup(false)}
              />
            )}
          </div>
        )}

        {/* Feedback list */}
        {view === "feedback" && (
          <div>
            {feedbackLoading ? (
              <p className="text-gray-500">Loading…</p>
            ) : feedback.length === 0 ? (
              <p className="text-gray-500">No feedback yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.map((f) => (
                  <div key={f.id} className={`rounded-xl border p-4 transition-colors ${f.readAt ? "border-white/5 bg-white/2 opacity-60" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{f.type}</span>
                          {!f.readAt && <span className="text-xs text-cyan-400 font-medium">New</span>}
                          <span className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">{f.text}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!f.readAt && (
                          <button onClick={() => markRead(f.id)} className="px-3 py-1 rounded bg-white/8 hover:bg-white/15 text-xs transition-colors">Mark read</button>
                        )}
                        <button onClick={() => deleteFeedbackEntry(f.id)} className="px-3 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seasons list */}
        {view === "seasons" && selected && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditSeason(null); setShowSeasonForm(true); }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + Add Season
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Season</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Start</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">End</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Confidence</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.seasons.map((s) => (
                    <tr key={s.startDate} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.seasonName}</td>
                      <td className="px-4 py-3 text-gray-400">{s.seasonNumber ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">{s.startDate}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">{s.endDate ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400">{s.confidence}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setEditSeason(s); setShowSeasonForm(true); }} className="px-3 py-1 rounded bg-white/8 hover:bg-white/15 text-xs transition-colors">Edit</button>
                          <button onClick={() => deleteSeason(selected.id, s.startDate)} className="px-3 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showSeasonForm && (
              <SeasonForm
                token={token}
                gameId={selected.id}
                initial={editSeason}
                onDone={async () => { setShowSeasonForm(false); setEditSeason(null); await selectGame(selected.id); flash(editSeason ? "Season updated" : "Season added"); }}
                onCancel={() => { setShowSeasonForm(false); setEditSeason(null); }}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ── AI Game Lookup Modal ──────────────────────────────────────────────────────

type AiGameResult = GameConfig & { seasons: [] };

function AiGameLookupModal({ token, onApprove, onCancel }: {
  token: string;
  onApprove: (game: GameConfig) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGameResult | null>(null);
  const [err, setErr] = useState("");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai-game-lookup", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ gameName: query.trim() }),
      });
      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try {
          const j = await res.json() as { error?: string };
          if (j.error) errText = j.error;
        } catch {
          errText = (await res.text()) || errText;
        }
        setErr(errText);
      } else {
        setResult(await res.json() as AiGameResult);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Game with AI" onCancel={onCancel}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Enter game name…"
            className="flex-1 bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            autoFocus
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {err && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{err}</p>}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">AI is searching the web…</p>
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col gap-4">
            {/* Preview card */}
            <div
              className="rounded-xl border border-white/10 overflow-hidden"
              style={{ "--gc": result.glowColor } as React.CSSProperties}
            >
              {/* Cover image */}
              <div className="relative h-36 bg-gray-800 overflow-hidden">
                {result.coverImage ? (
                  <Image
                    src={result.coverImage}
                    alt={result.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className={`absolute inset-0 bg-linear-to-br ${result.bgGradient}`} />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
              </div>

              {/* Card body */}
              <div className="px-4 py-3 flex flex-col gap-2 bg-gray-900/80">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{result.developer}</p>
                  <h3 className="text-lg font-bold" style={{ color: result.glowColor }}>{result.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {result.genres?.map((g: string) => (
                    <span key={g} className="px-2 py-0.5 rounded-full bg-white/8 text-gray-300">{g}</span>
                  ))}
                  <span className="px-2 py-0.5 rounded-full bg-white/8 text-gray-400 capitalize">{result.seasonType}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                  {result.steamAppId && <span>Steam ID: <span className="text-gray-200 font-mono">{result.steamAppId}</span></span>}
                  <span>Popularity: <span className="text-gray-200">{result.popularityScore}/100</span></span>
                  {result.officialUrl && (
                    <span className="col-span-2 truncate">
                      <a href={result.officialUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline truncate">{result.officialUrl}</a>
                    </span>
                  )}
                </div>
                {result.searchHints?.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <p className="mb-0.5 text-gray-400">Search hints:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {result.searchHints.map((h: string) => <li key={h}>{h}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={search}
                className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => onApprove(result)}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
              >
                Approve & Edit →
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Game Form (Add + Edit) ─────────────────────────────────────────────────────

type GameFormState = {
  id: string; name: string; shortName: string; developer: string; seasonType: string;
  accentColor: string; accentBg: string; bgGradient: string; glowColor: string;
  coverImage: string; officialUrl: string; popularityScore: number;
  searchHints: string; genres: string;
};

function gameConfigToForm(g: GameConfig): GameFormState {
  return {
    id: g.id, name: g.name, shortName: g.shortName ?? "",
    developer: g.developer, seasonType: g.seasonType,
    accentColor: g.accentColor ?? "text-cyan-400",
    accentBg: g.accentBg ?? "bg-cyan-400",
    bgGradient: g.bgGradient ?? "from-cyan-950/90 via-gray-900 to-gray-950",
    glowColor: g.glowColor ?? "#22d3ee",
    coverImage: g.coverImage ?? "", officialUrl: g.officialUrl ?? "",
    popularityScore: g.popularityScore ?? 50,
    searchHints: (g.searchHints ?? []).join("\n"),
    genres: (g.genres ?? []).join(", "),
  };
}

function GameForm({ token, initial, onDone, onCancel }: {
  token: string; initial?: GameConfig; onDone: () => void; onCancel: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<GameFormState>(
    initial ? gameConfigToForm(initial) : {
      id: "", name: "", shortName: "", developer: "", seasonType: "season",
      accentColor: "text-cyan-400", accentBg: "bg-cyan-400",
      bgGradient: "from-cyan-950/90 via-gray-900 to-gray-950",
      glowColor: "#22d3ee", coverImage: "", officialUrl: "",
      popularityScore: 50, searchHints: "", genres: "ARPG",
    }
  );
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function set(key: keyof GameFormState, val: string | number) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    const validationErr = validateGameForm(form as unknown as Record<string, unknown>);
    if (validationErr) { setErr(validationErr); return; }
    setErr(""); setSaving(true);

    const payload = {
      ...form,
      popularityScore: Number(form.popularityScore),
      genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
      searchHints: form.searchHints.split("\n").map((s) => s.trim()).filter(Boolean),
      ...(!isEdit && { seasons: [] }),
    };

    const res = isEdit
      ? await api(`/api/admin/games/${initial!.id}`, token, { method: "PUT", body: JSON.stringify(payload) })
      : await api("/api/admin/games", token, { method: "POST", body: JSON.stringify(payload) });

    setSaving(false);
    if (res.ok) { onDone(); } else { setErr(await res.text()); }
  }

  return (
    <Modal title={isEdit ? `Edit: ${initial!.name}` : "Add Game"} onCancel={onCancel}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="ID" value={form.id} onChange={(v) => set("id", v)} required disabled={isEdit} hint={isEdit ? undefined : "Lowercase, letters, numbers, hyphens"} />
          <Field label="Name" value={form.name} onChange={(v) => set("name", v)} required />
          <Field label="Short Name" value={form.shortName} onChange={(v) => set("shortName", v)} />
          <Field label="Developer" value={form.developer} onChange={(v) => set("developer", v)} required />
          <SelectField label="Season Type" value={form.seasonType} options={SEASON_TYPES} onChange={(v) => set("seasonType", v)} />
          <Field label="Popularity (0–100)" value={String(form.popularityScore)} onChange={(v) => set("popularityScore", v)} type="number" min={0} max={100} />
          <Field label="Cover Image URL" value={form.coverImage} onChange={(v) => set("coverImage", v)} />
          <Field label="Official URL" value={form.officialUrl} onChange={(v) => set("officialUrl", v)} />
          <Field label="Glow Color (#hex)" value={form.glowColor} onChange={(v) => set("glowColor", v)} />
          <Field label="Genres (comma-sep)" value={form.genres} onChange={(v) => set("genres", v)} />
          <Field label="Accent Color (Tailwind)" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
          <Field label="Accent Bg (Tailwind)" value={form.accentBg} onChange={(v) => set("accentBg", v)} />
        </div>
        <Field label="BG Gradient (Tailwind)" value={form.bgGradient} onChange={(v) => set("bgGradient", v)} />
        <div>
          <label className="block text-xs text-gray-400 mb-1">Search Hints (one per line)</label>
          <textarea value={form.searchHints} onChange={(e) => set("searchHints", e.target.value)} rows={3} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50" />
        </div>
        {err && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-sm transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Game"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Season Form ───────────────────────────────────────────────────────────────

function SeasonForm({ token, gameId, initial, onDone, onCancel }: {
  token: string; gameId: string; initial: ManualSeasonEntry | null;
  onDone: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<ManualSeasonEntry>(initial ?? {
    seasonName: "", startDate: "", endDate: null, confidence: "high",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    const validationErr = validateSeasonForm(form);
    if (validationErr) { setErr(validationErr); return; }
    setErr(""); setSaving(true);

    const body = { ...form, endDate: form.endDate || null, seasonNumber: form.seasonNumber || undefined };
    const res = initial
      ? await api(`/api/admin/games/${gameId}/seasons/${encodeURIComponent(initial.startDate)}`, token, { method: "PUT", body: JSON.stringify(body) })
      : await api(`/api/admin/games/${gameId}/seasons`, token, { method: "POST", body: JSON.stringify(body) });

    setSaving(false);
    if (res.ok) { onDone(); } else { setErr(await res.text()); }
  }

  return (
    <Modal title={initial ? "Edit Season" : "Add Season"} onCancel={onCancel}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Season Name" value={form.seasonName} onChange={(v) => setForm({ ...form, seasonName: v })} required />
          <Field label="Season Number" value={String(form.seasonNumber ?? "")} onChange={(v) => setForm({ ...form, seasonNumber: v ? Number(v) : undefined })} type="number" min={1} />
          <DateField label="Start Date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} required />
          <DateField label="End Date" value={form.endDate ?? ""} onChange={(v) => setForm({ ...form, endDate: v || null })} />
          <SelectField label="Confidence" value={form.confidence ?? "high"} options={CONFIDENCE} onChange={(v) => setForm({ ...form, confidence: v as ManualSeasonEntry["confidence"] })} />
          <Field label="Source URL" value={form.sourceUrl ?? ""} onChange={(v) => setForm({ ...form, sourceUrl: v })} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50" />
        </div>
        {err && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-sm transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {saving ? "Saving…" : initial ? "Save" : "Add Season"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${active ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", min, max, disabled, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; min?: number; max?: number; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} min={min} max={max} disabled={disabled}
        className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function DateField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type="date" value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 scheme-dark"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
