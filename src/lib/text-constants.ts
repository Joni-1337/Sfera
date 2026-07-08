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
