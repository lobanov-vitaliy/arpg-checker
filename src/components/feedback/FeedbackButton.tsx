"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquarePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";

type FeedbackType = "idea" | "game";

const MIN = 10;
const MAX = 500;

export function FeedbackButton() {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate_limit">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function close() {
    setOpen(false);
    setStatus("idle");
    setText("");
    setType("idea");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < MIN || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        track("feedback_submit", { type });
        setStatus("success");
      } else if (data.error === "rate_limit") {
        setStatus("rate_limit");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const remaining = MAX - text.length;
  const tooShort = text.trim().length < MIN && text.length > 0;

  return (
    <>
      <button
        onClick={() => { setOpen(true); track("feedback_open"); }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
        {t("trigger")}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="w-full max-w-md rounded-xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <h2 className="text-base font-semibold text-white">{t("title")}</h2>
              <button
                onClick={close}
                aria-label={t("close")}
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === "success" ? (
              <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white font-semibold">{t("successTitle")}</p>
                <p className="text-sm text-gray-400">{t("successText")}</p>
                <button
                  onClick={close}
                  className="mt-2 px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12 text-sm text-gray-300 transition-colors"
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-5 py-4 flex flex-col gap-4">
                {/* Type selector */}
                <div className="flex gap-2">
                  {(["idea", "game"] as FeedbackType[]).map((t_) => (
                    <button
                      key={t_}
                      type="button"
                      onClick={() => setType(t_)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        type === t_
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15"
                      }`}
                    >
                      {t_ === "idea" ? t("typeIdea") : t("typeGame")}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div className="flex flex-col gap-1">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX))}
                    placeholder={t("placeholder")}
                    rows={4}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 px-3 py-2.5 resize-none focus:outline-none focus:border-white/25 transition-colors"
                  />
                  <div className="flex items-center justify-between px-0.5">
                    <span className={`text-xs ${tooShort ? "text-yellow-500/70" : "text-transparent"}`}>
                      {t("minLength", { min: MIN })}
                    </span>
                    <span className={`text-xs tabular-nums ${remaining < 50 ? "text-yellow-500/70" : "text-gray-600"}`}>
                      {remaining}
                    </span>
                  </div>
                </div>

                {/* Error states */}
                {(status === "error" || status === "rate_limit") && (
                  <p className="text-xs text-red-400">
                    {status === "rate_limit" ? t("errorRateLimit") : t("errorGeneral")}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={text.trim().length < MIN || status === "submitting"}
                  className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                >
                  {status === "submitting" ? t("submitting") : t("submit")}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
