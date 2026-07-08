import egeVariants from "@/data/question-bank/ege-variants.json";
import { type QuestionTemplate } from "@/lib/question-templates";
import { normalizeEgePrompt, parseEgePrompt } from "@/lib/ege-prompt";

type EgeVariant = QuestionTemplate[];

const variants = egeVariants as EgeVariant[];

export type EgeTestTemplateResult = {
  questions: QuestionTemplate[];
  variantNumber: number | null;
};

function variantNumberFromIndex(index: number, questions: QuestionTemplate[]): number {
  const fromPrompt = parseEgePrompt(questions[0]?.prompt ?? "").variantNumber;
  return fromPrompt ?? index + 1;
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

/** Случайный пробный вариант ЕГЭ из загруженного банка (12 вопросов). */
export function getEgeTestTemplate(): EgeTestTemplateResult {
  if (variants.length === 0) {
    return { questions: [], variantNumber: null };
  }
  const index = Math.floor(Math.random() * variants.length);
  const questions = variants[index];
  return {
    questions,
    variantNumber: variantNumberFromIndex(index, questions),
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

export function resolveTestVariantLabel(
  egeVariantNumber: number | null | undefined,
  questions: EgeQuestionLike[]
): string | null {
  const number = egeVariantNumber ?? detectEgeVariantNumber(questions);
  return number != null ? `Вариант ${number}` : null;
}
