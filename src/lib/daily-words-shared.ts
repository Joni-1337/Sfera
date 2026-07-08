import { cleanHardWordAnswer } from "@/lib/hard-words-utils";

export const DAILY_WORD_COUNT = 3;

export function getTodayDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

function formatDateKeyFromUtc(ms: number) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function addDaysToDateKey(key: string, days: number) {
  return formatDateKeyFromUtc(parseDateKey(key) + days * 24 * 60 * 60 * 1000);
}

export function getDateKeyDaysAgo(daysAgo: number, from = new Date()) {
  return addDaysToDateKey(getTodayDateKey(from), -daysAgo);
}

export function daysBetween(fromKey: string, toKey: string) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

export function computeStreakFromCompletedDates(
  completedDates: Set<string> | Iterable<string>,
  anchorDateKey = getTodayDateKey()
) {
  const dates = completedDates instanceof Set ? completedDates : new Set(completedDates);
  if (dates.size === 0) return 0;

  let cursor = dates.has(anchorDateKey)
    ? anchorDateKey
    : addDaysToDateKey(anchorDateKey, -1);

  if (!dates.has(cursor)) return 0;

  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

export function computeBestStreakFromCompletedDates(
  completedDates: Set<string> | Iterable<string>
) {
  const sorted = [...(completedDates instanceof Set ? completedDates : new Set(completedDates))].sort();
  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < sorted.length; index++) {
    if (daysBetween(sorted[index - 1], sorted[index]) === 1) {
      current++;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
  }

  return best;
}

export function buildStreakProgress(streak: number, maxDays = 7) {
  const filled = Math.min(Math.max(streak, 0), maxDays);

  return Array.from({ length: maxDays }, (_, index) => ({
    index,
    completed: index < filled,
  }));
}

export function normalizeWord(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
}

export function matchesWord(input: string, word: string) {
  return (
    normalizeWord(cleanHardWordAnswer(input)) === normalizeWord(cleanHardWordAnswer(word))
  );
}

export function streakLabel(count: number) {
  if (count <= 0) return "Начните сегодня";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} день подряд`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} дня подряд`;
  }
  return `${count} дней подряд`;
}

export function parseWordIds(raw: string) {
  return raw.split("|").map((part) => part.trim()).filter(Boolean);
}

export function serializeWordIds(ids: string[]) {
  return ids.join("|");
}

export function collectShownWordIds(sessions: { wordIds: string }[]) {
  const ids = new Set<string>();
  for (const session of sessions) {
    for (const id of parseWordIds(session.wordIds)) {
      ids.add(id);
    }
  }
  return ids;
}

export function pickDailyWordIds(
  allWords: { id: string; learned: boolean }[],
  shownWordIds: Set<string>,
  studentId: string,
  dateKey: string,
  shuffle: <T>(items: T[], seed: string) => T[]
) {
  if (allWords.length === 0) return [];

  const unlearned = allWords.filter((word) => !word.learned);
  const allLearned = unlearned.length === 0;
  const poolSize = Math.min(DAILY_WORD_COUNT, allWords.length);

  if (allLearned) {
    return shuffle(allWords, `${studentId}:${dateKey}:review`)
      .slice(0, poolSize)
      .map((word) => word.id);
  }

  const fresh = unlearned.filter((word) => !shownWordIds.has(word.id));
  const pool =
    fresh.length >= DAILY_WORD_COUNT
      ? fresh
      : unlearned;

  const count = Math.min(DAILY_WORD_COUNT, pool.length);

  return shuffle(pool, `${studentId}:${dateKey}:learn`)
    .slice(0, count)
    .map((word) => word.id);
}

export type DailyWordItem = {
  id: string;
  topic: string;
  word: string;
  definition: string;
  example: string;
};

export type StreakProgressSlot = {
  index: number;
  completed: boolean;
};

export type DailyWordState = {
  dateKey: string;
  streak: number;
  streakBest: number;
  streakLabel: string;
  streakProgress: StreakProgressSlot[];
  completedToday: boolean;
  todayScore: number | null;
  words: DailyWordItem[];
  canStart: boolean;
  totalWords: number;
  learnedCount: number;
};
