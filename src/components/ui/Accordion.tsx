"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({
  title,
  defaultOpen = true,
  children,
  count,
  nested = false,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
  nested?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden border border-border",
        nested ? "rounded-xl bg-bg-elevated/50" : "rounded-2xl bg-bg-card"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between text-left transition-colors hover:bg-bg-elevated/50",
          nested ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-accent transition-transform sm:h-5 sm:w-5",
              open && "rotate-180"
            )}
          />
          <span className={cn("truncate font-medium", nested && "text-sm")}>{title}</span>
          {count !== undefined && (
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              {count}
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className={cn("border-t border-border", nested ? "px-4 py-3" : "px-5 py-4")}>
          {children}
        </div>
      )}
    </div>
  );
}
