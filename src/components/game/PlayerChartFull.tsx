"use client";

import { useState } from "react";
import type { SteamData, PlayerSnapshot } from "@/types";

interface PlayerChartFullProps {
  steam: SteamData;
  glowColor: string;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}

interface TooltipState {
  x: number;
  y: number;
  value: number;
  date: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTooltipDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterSnapshots(
  snapshots: PlayerSnapshot[],
  seasonStart?: string | null,
  seasonEnd?: string | null
): PlayerSnapshot[] {
  if (!seasonStart && !seasonEnd) return snapshots;
  const from = seasonStart ? new Date(seasonStart).getTime() : 0;
  const to = seasonEnd ? new Date(seasonEnd).getTime() : Date.now();
  const filtered = snapshots.filter((s) => {
    const t = new Date(s.t).getTime();
    return t >= from && t <= to;
  });
  return filtered.length >= 2 ? filtered : snapshots;
}

function buildPath(values: number[], width: number, height: number, pad: number) {
  if (values.length < 2) return { path: "", points: [] as { x: number; y: number }[] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));

  const path = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
  return { path, points };
}

export function PlayerChartFull({
  steam,
  glowColor,
  seasonStart,
  seasonEnd,
}: PlayerChartFullProps) {
  const W = 800;
  const H = 120;
  const PAD = 6;
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const filtered = filterSnapshots(steam.snapshots, seasonStart, seasonEnd);
  const values = filtered.map((s) => s.p);
  const { path, points } = buildPath(values, W, H, PAD);

  const last = values[values.length - 1] ?? 0;
  const prev = values[Math.max(0, values.length - 49)] ?? last;
  const trendPct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  const trendUp = trendPct >= 0;
  const peakInRange = values.length > 0 ? Math.max(...values) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold text-xl">{formatCount(steam.currentPlayers)}</span>
          <span className="text-gray-500 text-sm">Steam online</span>
        </div>
        <div className="flex items-center gap-3">
          {values.length > 48 && (
            <span className={`text-sm font-medium ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
              {trendUp ? "▲" : "▼"} {Math.abs(trendPct).toFixed(1)}%
            </span>
          )}
          <span className="text-gray-500 text-sm">
            Peak <span className="text-gray-300 font-medium">{formatCount(peakInRange)}</span>
          </span>
          <span className="text-gray-500 text-sm">
            7d Peak <span className="text-gray-300 font-medium">{formatCount(steam.peakPlayers7d)}</span>
          </span>
        </div>
      </div>

      {path && (
        <div
          className="relative cursor-crosshair rounded-md overflow-hidden"
          style={{ height: H }}
          onMouseMove={(e) => {
            if (points.length < 2) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(pct * (points.length - 1));
            const clamped = Math.max(0, Math.min(points.length - 1, idx));
            setTooltip({
              x: pct * 100,
              y: (points[clamped].y / H) * 100,
              value: values[clamped],
              date: filtered[clamped].t,
            });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`chart-fill-${steam.gameId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={glowColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} V ${H} H 0 Z`} fill={`url(#chart-fill-${steam.gameId})`} />
            <path
              d={path}
              fill="none"
              stroke={glowColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {tooltip && (
            <>
              <div
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{ left: `${tooltip.x}%`, backgroundColor: `${glowColor}60` }}
              />
              <div
                className="absolute w-3 h-3 rounded-full border-2 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${tooltip.x}%`,
                  top: `${tooltip.y}%`,
                  backgroundColor: glowColor,
                  borderColor: "#111827",
                }}
              />
              <div
                className="absolute bottom-full mb-2 pointer-events-none z-20 whitespace-nowrap"
                style={{
                  left: `${tooltip.x}%`,
                  transform: `translateX(${tooltip.x > 70 ? "-90%" : tooltip.x < 30 ? "-10%" : "-50%"})`,
                }}
              >
                <div className="bg-gray-800 border border-gray-700 rounded-md px-2.5 py-1.5 shadow-xl">
                  <p className="text-white text-sm font-semibold">{formatCount(tooltip.value)}</p>
                  <p className="text-gray-400 text-xs">{formatTooltipDate(tooltip.date)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-gray-600 text-right">
        Last updated {new Date(steam.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
