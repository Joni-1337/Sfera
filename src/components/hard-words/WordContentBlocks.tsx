import { cn } from "@/lib/utils";

export function parseWordExamples(example: string) {
  return example
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function WordContentBlocks({
  definition,
  example,
  className,
  compact = false,
}: {
  definition: string;
  example?: string;
  className?: string;
  compact?: boolean;
}) {
  const examples = example ? parseWordExamples(example) : [];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl bg-bg-elevated/70 px-4 py-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent/80">
          Правило
        </p>
        <p
          className={cn(
            "leading-relaxed text-text-secondary",
            compact ? "text-sm" : "text-[15px]"
          )}
        >
          {definition}
        </p>
      </div>

      {examples.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-bg-elevated/30 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Примеры
          </p>
          <ul className="space-y-1.5">
            {examples.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className={cn(
                  "flex gap-2 leading-relaxed text-text-primary/90",
                  compact ? "text-sm" : "text-[15px]"
                )}
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                <span className="italic">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
