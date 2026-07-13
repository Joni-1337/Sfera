export const TEXT_TYPES = [
  "Художественные тексты",
  "Научные тексты",
  "Публицистические тексты",
  "Очерки",
] as const;

export type TextType = (typeof TEXT_TYPES)[number];

export const TEXT_TOPIC_SUGGESTIONS = [
  "Природа",
  "Образование",
  "Семья",
  "Общество",
  "Наука",
  "Культура",
  "История",
  "Мораль",
] as const;

/** Годы в фильтре библиотеки текстов (включая актуальный, даже если текстов ещё нет). */
export const TEXT_FILTER_YEARS = [2026, 2025, 2024, 2023, 2022, 2021] as const;
