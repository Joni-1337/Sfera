"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "@/lib/tawk-types";

const STORAGE_KEY = "sfera:tawk-welcome-dismissed";
const SHOW_DELAY_MS = 4000;

function openTawkChat() {
  window.Tawk_API?.maximize?.();
}

export function TawkWelcomePrompt() {
  const enabled = Boolean(process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  if (!enabled || !visible) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleAction() {
    dismiss();
    openTawkChat();
  }

  return (
    <div
      className="fixed bottom-24 right-5 z-[999998] w-[min(calc(100vw-2.5rem),288px)] rounded-2xl border border-border/80 bg-[#1c1c24] p-4 shadow-2xl shadow-black/40"
      role="dialog"
      aria-label="Приглашение в чат поддержки"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="pr-6 text-[15px] font-medium leading-snug text-text-primary">
        👋 Здравствуйте! Чем можем помочь?
      </p>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={handleAction}
          className="w-full rounded-full border border-accent/50 bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/10"
        >
          У меня вопрос
        </button>
        <button
          type="button"
          onClick={handleAction}
          className="w-full rounded-full border border-accent/50 bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/10"
        >
          Расскажите подробнее
        </button>
      </div>
    </div>
  );
}
