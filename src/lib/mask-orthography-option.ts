const MASK = "...";

/** Префиксы для наречий (длинные первыми). */
const ADVERB_PREFIXES = [
  "без",
  "под",
  "над",
  "из",
  "ис",
  "от",
  "до",
  "за",
  "на",
  "по",
  "во",
  "со",
  "об",
  "в",
  "с",
  "к",
  "ко",
] as const;

function maskOrthographyCore(text: string): string {
  if (/\s/.test(text)) {
    return text.replace(/\s+/g, MASK);
  }

  if (text.includes("-")) {
    return text.replace(/-/g, MASK);
  }

  const lower = text.toLowerCase();
  for (const prefix of ADVERB_PREFIXES) {
    if (lower.startsWith(prefix) && text.length > prefix.length + 1) {
      return text.slice(0, prefix.length) + MASK + text.slice(prefix.length);
    }
  }

  if (text.length >= 4) {
    return text.slice(0, 2) + MASK + text.slice(2);
  }

  return text;
}

/** Маскирует пробел/дефис/стык в варианте ответа, чтобы не выдавать правильный ответ. */
export function maskOrthographyOption(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const parenMatch = trimmed.match(/^(.+?)(\s*\([^)]*\))$/);
  const main = (parenMatch?.[1] ?? trimmed).trim();
  const suffix = parenMatch?.[2] ?? "";

  if (main.includes(MASK)) {
    return main.replace(/\s+/g, MASK) + suffix;
  }

  return maskOrthographyCore(main) + suffix;
}

export function isAdverbPrompt(prompt: string): boolean {
  return /нареч/i.test(prompt);
}

export function maskOrthographyOptionIfNeeded(prompt: string, raw: string): string {
  if (!isAdverbPrompt(prompt)) return raw;
  return maskOrthographyOption(raw);
}
