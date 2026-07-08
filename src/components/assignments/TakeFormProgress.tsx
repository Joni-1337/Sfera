"use client";

import { cn } from "@/lib/utils";

export function TakeFormProgress({
  currentQuestion,
  answeredCount,
  totalCount,
  saveStatus,
}: {
  currentQuestion: number;
  answeredCount: number;
  totalCount: number;
  saveStatus: "idle" | "saving" | "saved";
}) {
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="sticky top-16 z-20 -mx-1 mb-6 rounded-2xl border border-border bg-bg-card/95 px-4 py-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Вопрос <span className="text-accent">{currentQuestion}</span> из {totalCount}
        </p>
        <p className="text-xs text-text-muted">
          {saveStatus === "saving" && "Сохранение..."}
          {saveStatus === "saved" && (
            <span className="text-green-400">Сохранено</span>
          )}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn("h-full rounded-full bg-accent transition-all duration-300")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-text-muted">
        Ответов: {answeredCount}/{totalCount}
      </p>
    </div>
  );
}
