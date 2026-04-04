"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export function LoginForm({ invalid }: { invalid?: boolean }) {
  const [token, setToken] = useState("");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/${locale}/admin?token=${encodeURIComponent(token.trim())}`);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-white/10 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-white mb-6 text-center">Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter secret token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            className="bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
          {invalid && (
            <p className="text-red-400 text-sm text-center">Invalid token</p>
          )}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
