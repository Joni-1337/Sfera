import { cn } from "@/lib/utils";

/** Текстовые поля и textarea в формах. */
export const fieldInputClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

/** Компактное поле (узкое число и т.п.). */
export const fieldInputCompactClass =
  "rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

/** Выпадающий список — chevron задаётся в globals.css (.field-select). */
export const fieldSelectClass =
  "field-select rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export const fieldSelectCompactClass =
  "field-select rounded-lg border border-border bg-bg-elevated px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

/** Кнопки-чипы для выбора числа, режима и т.п. */
export function choiceChipClass(selected: boolean, disabled = false) {
  return cn(
    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
    selected
      ? "border-accent/45 bg-accent/10 text-teal-100"
      : "border-border bg-bg-elevated/80 text-text-secondary hover:border-accent/30 hover:text-text-primary",
    disabled && "cursor-not-allowed opacity-40"
  );
}

/** Вкладки источника вопросов (Готовые / Вручную / Excel). */
export function sourceTabClass(selected: boolean) {
  return cn(
    "rounded-xl border px-2 py-3 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent/35 sm:px-4",
    selected
      ? "border-accent/45 bg-accent/10 text-teal-100"
      : "border-border bg-bg-elevated/40 text-text-secondary hover:border-accent/30 hover:text-text-primary"
  );
}
