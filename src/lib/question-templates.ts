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

const DEFAULT_TEMPLATE_COUNT = 3;

function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getTemplatesForCategory(
  category: string,
  count = DEFAULT_TEMPLATE_COUNT
): QuestionTemplate[] {
  const pool = QUESTION_TEMPLATES[category] ?? QUESTION_TEMPLATES.orthography;
  return pickRandom(pool, count);
}
