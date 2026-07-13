export const OPTION_SEPARATOR = "|";

export const CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

/** Русские буквы для нумерации вариантов: А, Б, В, Г, Д… */
const CYRILLIC_LABELS = "АБВГДЕЖЗИ";

const CHOICE_ALIASES = new Map<string, string>();

function registerChoiceAlias(alias: string, letter: string) {
  CHOICE_ALIASES.set(alias, letter);
  CHOICE_ALIASES.set(alias.toUpperCase(), letter);
  CHOICE_ALIASES.set(alias.toLowerCase(), letter);
}

CHOICE_LETTERS.forEach((letter, index) => {
  registerChoiceAlias(letter, letter);
  registerChoiceAlias(String(index + 1), letter);
});

CYRILLIC_LABELS.split("").forEach((label, index) => {
  if (index < CHOICE_LETTERS.length) {
    registerChoiceAlias(label, CHOICE_LETTERS[index]);
  }
});

/** Кириллическая «С» часто путают с латинской C */
registerChoiceAlias("С", "C");
registerChoiceAlias("с", "C");

export function parseOptionsList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(OPTION_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeOptionsList(options: string[]): string {
  return options.map((part) => part.trim()).filter(Boolean).join(OPTION_SEPARATOR);
}

export type QuestionOptionFields = {
  answerOptions?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
};

export function getQuestionOptions(fields: QuestionOptionFields): string[] {
  const fromPipe = parseOptionsList(fields.answerOptions);
  if (fromPipe.length > 0) return fromPipe;

  return [fields.optionA, fields.optionB, fields.optionC, fields.optionD]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);
}

export function optionsToFields(options: string[]) {
  return {
    answerOptions: serializeOptionsList(options),
    optionA: options[0] ?? "",
    optionB: options[1] ?? "",
    optionC: options[2] ?? "",
    optionD: options[3] ?? "",
  };
}

export function getChoiceOptions(fields: QuestionOptionFields) {
  return getQuestionOptions(fields).map((text, index) => ({
    key: CHOICE_LETTERS[index] ?? String(index + 1),
    text,
  }));
}

export function normalizeChoiceLetter(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = CHOICE_ALIASES.get(trimmed);
  if (direct) return direct;

  const first = trimmed.charAt(0);
  return CHOICE_ALIASES.get(first) ?? null;
}

/** Буква A/B/C… по тексту варианта или по букве/цифре в ячейке «правильный». */
export function resolveMultipleChoiceCorrect(
  options: string[],
  correctRaw: string
): string | null {
  const trimmed = correctRaw.trim();
  if (!trimmed) return null;

  const letter = normalizeChoiceLetter(trimmed);
  if (letter) {
    const index = CHOICE_LETTERS.indexOf(letter as (typeof CHOICE_LETTERS)[number]);
    if (index >= 0 && index < options.length) return letter;
  }

  const normalized = trimmed.toLowerCase();
  const index = options.findIndex((option) => option.trim().toLowerCase() === normalized);
  if (index >= 0) {
    return CHOICE_LETTERS[index] ?? null;
  }

  return null;
}

export function normalizeCorrectAnswer(type: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (type === "multiple_choice") {
    return normalizeChoiceLetter(trimmed) ?? trimmed.toUpperCase();
  }

  if (type === "ege_numbers") {
    return trimmed.replace(/\s+/g, " ");
  }

  if (trimmed.includes(OPTION_SEPARATOR)) {
    return serializeOptionsList(parseOptionsList(trimmed).map((part) => part.toLowerCase()));
  }

  return trimmed.toLowerCase();
}

export function getOptionText(fields: QuestionOptionFields, letter: string): string {
  const normalized = normalizeChoiceLetter(letter) ?? letter.toUpperCase();
  const options = getChoiceOptions(fields);
  return options.find((option) => option.key === normalized)?.text ?? letter;
}
