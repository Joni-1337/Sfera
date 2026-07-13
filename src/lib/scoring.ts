import {

  normalizeChoiceLetter,

  normalizeCorrectAnswer,

  parseOptionsList,

} from "@/lib/question-options";



export const QUESTION_TYPES = [

  { id: "multiple_choice", label: "Выбор из вариантов" },

  { id: "gap_fill", label: "Пропущенная буква" },

  { id: "ege_numbers", label: "Номера ответов" },

  { id: "text", label: "Ввод текста" },

] as const;



export type QuestionType = (typeof QUESTION_TYPES)[number]["id"];



export function normalizeAnswer(value: string): string {

  return value.trim().toLowerCase().replace(/\s+/g, " ");

}



function splitAcceptableAnswers(correctRaw: string): string[] {
  const trimmed = correctRaw.trim();
  if (!trimmed) return [];

  const fromPipe = parseOptionsList(trimmed);
  if (fromPipe.length > 1) return fromPipe;

  if (trimmed.includes("/")) {
    return trimmed
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

function normalizeNumberSet(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 10))
    .filter((num) => Number.isFinite(num))
    .sort((a, b) => a - b)
    .join(" ");
}

function isNumberSetAnswer(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length > 0 && /^[\d\s]+$/.test(trimmed);
}

function matchesAnyAcceptable(student: string, correctRaw: string): boolean {
  const variants = splitAcceptableAnswers(correctRaw);

  return variants.some((variant) => {
    const normalized = normalizeAnswer(variant);

    if (isNumberSetAnswer(variant)) {
      return normalizeNumberSet(student) === normalizeNumberSet(variant);
    }

    return (
      student === normalized ||
      student.replace(/[^а-яёa-z0-9]/gi, "") ===
        normalized.replace(/[^а-яёa-z0-9]/gi, "")
    );
  });
}



export function checkAnswer(

  questionType: string,

  studentAnswer: string,

  correctAnswer: string

): boolean {

  const student = normalizeAnswer(studentAnswer);

  if (!student) return false;



  if (questionType === "multiple_choice") {

    const studentLetter = normalizeChoiceLetter(studentAnswer);

    const correctLetter = normalizeChoiceLetter(correctAnswer);

    if (!studentLetter || !correctLetter) return false;

    return studentLetter === correctLetter;

  }



  if (
    questionType === "gap_fill" ||
    questionType === "text" ||
    questionType === "ege_numbers"
  ) {
    return matchesAnyAcceptable(student, correctAnswer);
  }

  return false;

}



export function questionTypeLabel(type: string): string {

  return QUESTION_TYPES.find((t) => t.id === type)?.label ?? type;

}



export { normalizeCorrectAnswer };

