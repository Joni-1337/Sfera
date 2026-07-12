import orthography from "@/data/question-bank/orthography.json";
import task9 from "@/data/question-bank/task-9.json";
import adverbs from "@/data/question-bank/adverbs.json";
import task4 from "@/data/question-bank/task-4.json";
import task78 from "@/data/question-bank/task-7-8.json";

export type QuestionTemplate = {
  type?: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

export const QUESTION_TEMPLATES: Record<string, QuestionTemplate[]> = {
  orthography: orthography as QuestionTemplate[],
  "task-9": task9 as QuestionTemplate[],
  adverbs: adverbs as QuestionTemplate[],
  "task-4": task4 as QuestionTemplate[],
  "task-7-8": task78 as QuestionTemplate[],
};

export const DEFAULT_TEMPLATE_COUNT = 3;

export const TEMPLATE_COUNT_PRESETS = [3, 5, 7, 10, 15] as const;
export const MAX_TEMPLATE_COUNT = 30;

function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getTemplateBankSize(category: string): number {
  const pool = QUESTION_TEMPLATES[category] ?? QUESTION_TEMPLATES.orthography;
  return pool.length;
}

export function normalizeTemplateCount(raw: unknown): number {
  const parsed =
    typeof raw === "number"
      ? raw
      : Number.parseInt(String(raw ?? DEFAULT_TEMPLATE_COUNT), 10);

  if (!Number.isFinite(parsed)) return DEFAULT_TEMPLATE_COUNT;
  return Math.min(Math.max(parsed, 1), MAX_TEMPLATE_COUNT);
}

export function getTemplatesForCategory(
  category: string,
  count = DEFAULT_TEMPLATE_COUNT
): QuestionTemplate[] {
  const pool = QUESTION_TEMPLATES[category] ?? QUESTION_TEMPLATES.orthography;
  return pickRandom(pool, normalizeTemplateCount(count));
}
