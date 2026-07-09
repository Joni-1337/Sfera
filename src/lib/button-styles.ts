/** Основная кнопка — заливка accent, хорошо читается на тёмном фоне */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/25 transition-colors hover:bg-accent-hover";

/** Вторичная кнопка — рамка, светлый текст */
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent/40 hover:text-accent";

/** Ссылка-действие в карточке («Открыть →») */
export const btnCardAction =
  "shrink-0 text-sm font-semibold text-text-primary transition-colors hover:text-accent";
