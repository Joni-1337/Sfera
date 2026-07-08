export const HARD_WORD_TOPICS = [
  { id: "orthography", label: "Орфография" },
  { id: "lexis", label: "Лексика" },
  { id: "morphology", label: "Морфология" },
  { id: "syntax", label: "Синтаксис" },
  { id: "punctuation", label: "Пунктуация" },
  { id: "stylistics", label: "Стилистика" },
] as const;

export type HardWordTopicId = (typeof HARD_WORD_TOPICS)[number]["id"];

export function hardWordTopicLabel(id: string) {
  return HARD_WORD_TOPICS.find((t) => t.id === id)?.label ?? id;
}
