"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { updateTeacherTheme } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { UiTheme } from "@/components/layout/ThemeProvider";

const THEMES: { id: UiTheme; label: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Тёмная", icon: Moon },
  { id: "light", label: "Светлая", icon: Sun },
];

export function ThemeSelector({ currentTheme }: { currentTheme: UiTheme }) {
  const [selected, setSelected] = useState(currentTheme);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSelected(currentTheme);
  }, [currentTheme]);

  function handleSelect(theme: UiTheme) {
    if (theme === selected || pending) return;
    setError(null);
    setSelected(theme);
    document.documentElement.dataset.theme = theme;

    startTransition(async () => {
      const result = await updateTeacherTheme(theme);
      if (result?.error) {
        setError(result.error);
        setSelected(currentTheme);
        document.documentElement.dataset.theme = currentTheme;
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all disabled:opacity-50",
              selected === id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-bg-elevated text-text-secondary hover:border-accent/30"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
