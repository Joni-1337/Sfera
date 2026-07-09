import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiTheme } from "@/components/layout/ThemeProvider";

const THEMES: { id: UiTheme; label: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Тёмная", icon: Moon },
  { id: "light", label: "Светлая", icon: Sun },
];

export function StudentThemePreview({ currentTheme }: { currentTheme: UiTheme }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map(({ id, label, icon: Icon }) => {
        const active = currentTheme === id;
        return (
          <div
            key={id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium",
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-bg-elevated/40 text-text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
            {active ? (
              <span className="text-[10px] font-normal uppercase tracking-wide text-accent/80">
                Сейчас
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
