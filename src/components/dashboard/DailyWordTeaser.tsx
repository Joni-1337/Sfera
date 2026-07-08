import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DailyWordState } from "@/lib/daily-words-shared";
import { cn } from "@/lib/utils";

export function DailyWordTeaser({ state }: { state: DailyWordState | null }) {
  if (!state || state.totalWords === 0) return null;

  const subtitle = state.completedToday
    ? "Сегодня пройдено"
    : state.canStart
      ? "3 слова на сегодня"
      : `Выучено ${state.learnedCount} из ${state.totalWords}`;

  const hasStreak = state.streak > 0;

  return (
    <Link
      href="/hard-words#daily"
      className={cn(
        "mb-6 flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-orange-500/10 via-bg-card to-bg-card px-4 py-3.5 transition-colors",
        state.completedToday
          ? "border-amber-400/35 hover:border-amber-400/50"
          : "border-orange-500/30 hover:border-orange-500/45"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          state.completedToday
            ? "bg-gradient-to-br from-amber-400/30 to-orange-500/20 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50"
            : hasStreak
              ? "bg-gradient-to-br from-orange-500/30 to-orange-600/15 shadow-[0_0_16px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/40"
              : "bg-gradient-to-br from-orange-500/25 to-orange-600/10 ring-1 ring-orange-400/30"
        )}
      >
        <span
          className={cn(
            "text-2xl font-bold leading-none tabular-nums",
            state.completedToday
              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              : hasStreak
                ? "text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]"
                : "text-orange-400"
          )}
        >
          {state.streak}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Ударный режим</p>
        <p className="truncate text-xs text-text-muted">{subtitle}</p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </Link>
  );
}
