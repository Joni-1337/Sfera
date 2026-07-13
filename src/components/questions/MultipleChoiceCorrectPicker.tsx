"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { CHOICE_LETTERS, parseMultipleChoiceCorrect, toggleMultipleChoiceCorrect } from "@/lib/question-options";
import { cn } from "@/lib/utils";

export function MultipleChoiceCorrectPicker({
  value,
  onChange,
  letters = CHOICE_LETTERS.slice(0, 4),
}: {
  value: string;
  onChange: (value: string) => void;
  letters?: readonly string[];
}) {
  const selected = new Set(parseMultipleChoiceCorrect(value));

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">Правильные ответы — можно выбрать несколько</p>
      <div className="flex flex-wrap gap-2">
        {letters.map((letter) => {
          const checked = selected.has(letter);

          return (
            <label
              key={letter}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                checked
                  ? "border-accent/45 bg-accent/10 text-teal-100"
                  : "border-border bg-bg-elevated text-text-secondary hover:border-accent/25"
              )}
            >
              <Checkbox
                size="sm"
                checked={checked}
                onChange={() => onChange(toggleMultipleChoiceCorrect(value, letter))}
              />
              <span className="font-medium">{letter}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
