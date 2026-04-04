"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

export function RefreshButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    try {
      await fetch(`/api/seasons/${gameId}`);
      track("season_refresh", { gameId });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title="Refresh season data"
      className="text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
