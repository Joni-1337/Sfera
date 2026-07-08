import {

  normalizeChoiceLetter,

  normalizeCorrectAnswer,

  parseOptionsList,

} from "@/lib/question-options";



export const QUESTION_TYPES = [

  { id: "multiple_choice", label: "Выбор из вариантов" },

  { id: "gap_fill", label: "Пропущенная буква" },

  { id: "text", label: "Ввод текста" },

] as const;



export type QuestionType = (typeof QUESTION_TYPES)[number]["id"];



export function normalizeAnswer(value: string): string {

  return value.trim().toLowerCase().replace(/\s+/g, " ");

}



function matchesAnyAcceptable(student: string, correctRaw: string): boolean {

  const acceptable = parseOptionsList(correctRaw);

  const variants = acceptable.length > 0 ? acceptable : [correctRaw];



  return variants.some((variant) => {

    const normalized = normalizeAnswer(variant);

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



  if (questionType === "gap_fill") {

    return matchesAnyAcceptable(student, correctAnswer);

  }



  return matchesAnyAcceptable(student, correctAnswer);

}



export function questionTypeLabel(type: string): string {

  return QUESTION_TYPES.find((t) => t.id === type)?.label ?? type;

}



export { normalizeCorrectAnswer };

