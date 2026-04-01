"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

const LS_KEY = "sp_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setFavorites(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("sp_favoritechange"));
}

interface FavoriteButtonProps {
  gameId: string;
}

export function FavoriteButton({ gameId }: FavoriteButtonProps) {
  const t = useTranslations("filter");
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().includes(gameId));
    const handler = () => setIsFav(getFavorites().includes(gameId));
    window.addEventListener("sp_favoritechange", handler);
    return () => window.removeEventListener("sp_favoritechange", handler);
  }, [gameId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = getFavorites();
    setFavorites(
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId],
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? t("favoriteRemove") : t("favoriteAdd")}
      className="p-1 rounded-md transition-colors hover:bg-white/10"
    >
      <Star
        className="w-3.5 h-3.5 transition-colors"
        style={{
          fill: isFav ? "#facc15" : "transparent",
          stroke: isFav ? "#facc15" : "#4b5563",
        }}
      />
    </button>
  );
}
