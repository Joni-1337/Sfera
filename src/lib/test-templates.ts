import russkij100Variants from "@/data/question-bank/russkij100-ege-variants.json";
import egeVariants from "@/data/question-bank/ege-variants.json";
import { type QuestionTemplate } from "@/lib/question-templates";
import { normalizeEgePrompt, parseEgePrompt } from "@/lib/ege-prompt";

type Russkij100Variant = {
  sourceId: number;
  title: string;
  questions: QuestionTemplate[];
};

type EgeVariant = QuestionTemplate[];

const russkij100Bank = russkij100Variants as Russkij100Variant[];
const legacyVariants = egeVariants as EgeVariant[];

const useRusskij100Bank = russkij100Bank.length > 0;
const variants = useRusskij100Bank
  ? russkij100Bank.map((entry) => entry.questions)
  : legacyVariants;

export type EgeTestTemplateResult = {
  questions: QuestionTemplate[];
  variantNumber: number | null;
  variantTitle: string | null;
};

function variantNumberFromIndex(index: number, questions: QuestionTemplate[]): number {
  const fromPrompt = parseEgePrompt(questions[0]?.prompt ?? "").variantNumber;
  return fromPrompt ?? index + 1;
}

function variantTitleFromIndex(index: number): string | null {
  if (!useRusskij100Bank) return null;
  return russkij100Bank[index]?.title ?? null;
}

type EgeQuestionLike = {
  prompt: string;
  correctOption?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
};

function egeQuestionFingerprint(q: EgeQuestionLike): string {
  return [
    normalizeEgePrompt(q.prompt),
    q.correctOption ?? "",
    q.optionA ?? "",
    q.optionB ?? "",
    q.optionC ?? "",
    q.optionD ?? "",
  ].join("\0");
}

function variantsMatch(
  bank: QuestionTemplate[],
  questions: EgeQuestionLike[]
): boolean {
  if (bank.length !== questions.length) return false;
  return bank.every(
    (q, idx) => egeQuestionFingerprint(q) === egeQuestionFingerprint(questions[idx])
  );
}

/** Случайный пробный вариант ЕГЭ из банка Russkij100 (приоритет) или legacy. */
export function getEgeTestTemplate(): EgeTestTemplateResult {
  if (variants.length === 0) {
    return { questions: [], variantNumber: null, variantTitle: null };
  }
  const index = Math.floor(Math.random() * variants.length);
  const questions = variants[index];
  return {
    questions,
    variantNumber: variantNumberFromIndex(index, questions),
    variantTitle: variantTitleFromIndex(index),
  };
}

export function getEgeTestVariantCount(): number {
  return variants.length;
}

/** Определяет номер варианта по совпадению вопросов с банком (для старых тестов). */
export function detectEgeVariantNumber(
  questions: EgeQuestionLike[]
): number | null {
  if (questions.length === 0) return null;

  for (const question of questions) {
    const { variantNumber } = parseEgePrompt(question.prompt);
    if (variantNumber != null) return variantNumber;
  }

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    if (variantsMatch(variant, questions)) {
      return variantNumberFromIndex(i, variant);
    }
  }

  return null;
}

export function detectEgeVariantTitle(
  questions: EgeQuestionLike[]
): string | null {
  if (!useRusskij100Bank || questions.length === 0) return null;

  for (const entry of russkij100Bank) {
    if (variantsMatch(entry.questions, questions)) {
      return entry.title;
    }
  }

  return null;
}

export function resolveTestVariantLabel(
  egeVariantNumber: number | null | undefined,
  questions: EgeQuestionLike[]
): string | null {
  const russkijTitle = detectEgeVariantTitle(questions);
  if (russkijTitle) return russkijTitle;

  const number = egeVariantNumber ?? detectEgeVariantNumber(questions);
  return number != null ? `Вариант ${number}` : null;
}
