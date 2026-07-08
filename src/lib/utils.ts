import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RESULT_CATEGORIES = [
  { id: "orthography", label: "Орфография (тексты с пропущенными буквами)" },
  { id: "ege-tests", label: "Тесты в формате ЕГЭ" },
  { id: "hard-words", label: "Сложные слова для блока «Орфография»" },
  { id: "task-9", label: "Задание 9" },
  { id: "adverbs", label: "Наречия (задание 14)" },
  { id: "task-4", label: "Задание 4" },
  { id: "task-22", label: "Тренировочные варианты (задание 22)" },
  { id: "task-21", label: "Тренировочные варианты (задание 21)" },
  { id: "task-7-8", label: "Задание 7 и 8" },
] as const;

export const TEXT_TYPES = [
  "Очерки",
  "Публицистические тексты",
  "Художественные тексты",
  "Научные тексты",
  "Публицистика",
] as const;

export const AUTHORS = [
  "Абрамов Ф.А.",
  "Авдеев А.С.",
  "Астафьев В.П.",
  "Бунин И.А.",
  "Гоголь Н.В.",
  "Достоевский Ф.М.",
  "Лесков Н.С.",
  "Толстой Л.Н.",
  "Чехов А.П.",
  "Шолохов М.А.",
] as const;

export const TOPICS = [
  "Природа",
  "Семья",
  "Общество",
  "Культура",
  "Наука",
  "История",
  "Мораль",
  "Образование",
] as const;
