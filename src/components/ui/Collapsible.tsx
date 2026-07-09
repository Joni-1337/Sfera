"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type CollapsibleProps = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** Плавно прокрутить к блоку при открытии — помогает не терять контекст */
  scrollOnOpen?: boolean;
};

export function Collapsible({
  open,
  children,
  className,
  innerClassName,
  scrollOnOpen = false,
}: CollapsibleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !scrollOnOpen || !ref.current) return;
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, scrollOnOpen]);

  return (
    <div
      ref={ref}
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className
      )}
      aria-hidden={!open}
    >
      <div className={cn("min-h-0 overflow-hidden", innerClassName)}>
        <div
          className={cn(
            "transition-opacity duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function chevronClass(open: boolean, className?: string) {
  return cn(
    "transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
    open && "rotate-180",
    className
  );
}
