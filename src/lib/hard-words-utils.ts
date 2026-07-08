export type WordSort = "alpha-asc" | "alpha-desc";

/** Убирает пояснения в скобках из ответа словаря — «Около пятисот (человек)» → «Около пятисот». */
export function cleanHardWordAnswer(value: string): string {
  return value
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareHardWordFields(word: string, definition: string, example = "") {
  const cleanedWord = cleanHardWordAnswer(word);
  return {
    word: cleanedWord,
    definition: definition.trim(),
    example: example.trim(),
  };
}

export const RUSSIAN_LETTERS = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");

export function normalizeWordSearch(text: string) {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

export function filterWordsBySearch<
  T extends { word: string; definition: string; example?: string },
>(words: T[], query: string) {
  const normalized = normalizeWordSearch(query);
  if (!normalized) return words;

  return words.filter(
    (word) =>
      normalizeWordSearch(word.word).includes(normalized) ||
      normalizeWordSearch(word.definition).includes(normalized) ||
      (word.example && normalizeWordSearch(word.example).includes(normalized))
  );
}

export function sortWords<T extends { word: string }>(words: T[], sort: WordSort) {
  return [...words].sort((a, b) => {
    const cmp = a.word.localeCompare(b.word, "ru", { sensitivity: "base" });
    return sort === "alpha-asc" ? cmp : -cmp;
  });
}

export function getWordFirstLetter(word: string) {
  const first = word.trim().charAt(0).toUpperCase();
  if (/[А-ЯЁ]/.test(first)) return first;
  return "#";
}

export function groupWordsByLetter<T extends { word: string }>(words: T[]) {
  const map = new Map<string, T[]>();

  for (const word of words) {
    const letter = getWordFirstLetter(word.word);
    const list = map.get(letter) ?? [];
    list.push(word);
    map.set(letter, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b, "ru");
    })
    .map(([letter, items]) => ({ letter, items }));
}

export function getAvailableLetters<T extends { word: string }>(words: T[]) {
  return groupWordsByLetter(words).map((group) => group.letter);
}
