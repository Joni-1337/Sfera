"use client";

import { useState, useTransition } from "react";
import { Pause } from "lucide-react";
import { addToPause, type AddToPauseInput } from "@/lib/pause-actions";
import { cn } from "@/lib/utils";

export function AddToPauseButton({
  studentId,
  className,
  ...data
}: AddToPauseInput & { studentId: string; className?: string }) {
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (added || pending) return;

    setAdded(true);
    startTransition(async () => {
      const result = await addToPause(studentId, data);
      if (!result?.success) setAdded(false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || added}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
        added
          ? "bg-yellow-500/10 text-yellow-400"
          : "text-text-muted hover:bg-bg-elevated hover:text-accent",
        className
      )}
    >
      <Pause className="h-3 w-3" />
      {added ? "В паузе" : "В паузу"}
    </button>
  );
}
