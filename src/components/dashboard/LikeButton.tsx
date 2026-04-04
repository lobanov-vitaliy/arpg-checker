"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { track } from "@vercel/analytics";

const LS_KEY = "sp_likes";

function getLikedGames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

interface LikeButtonProps {
  gameId: string;
  initialCount: number;
  className?: string;
}

export function LikeButton({ gameId, initialCount, className }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(getLikedGames().includes(gameId));
  }, [gameId]);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/likes/${gameId}`, { method: "POST" });
      const data = (await res.json()) as { count: number; liked: boolean };
      setCount(data.count);
      setLiked(data.liked);
      track(data.liked ? "like_add" : "like_remove", { gameId });
      const current = getLikedGames();
      if (data.liked) {
        if (!current.includes(gameId)) {
          localStorage.setItem(LS_KEY, JSON.stringify([...current, gameId]));
        }
      } else {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify(current.filter((id) => id !== gameId))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      aria-label="Like"
      className={
        className ??
        "flex items-center gap-1 p-1 rounded-md transition-colors hover:bg-white/10"
      }
    >
      <Heart
        className={`w-3.5 h-3.5 transition-colors ${
          liked ? "stroke-rose-400" : "stroke-white/70"
        }`}
        style={{ fill: liked ? "#fb7185" : "transparent" }}
      />
      {count > 0 && (
        <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
      )}
    </button>
  );
}
