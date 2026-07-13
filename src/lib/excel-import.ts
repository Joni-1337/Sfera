import * as XLSX from "xlsx";

import {
  CHOICE_LETTERS,
  normalizeCorrectAnswer,
  optionsToFields,
  parseOptionsList,
  resolveMultipleChoiceCorrect,
} from "@/lib/question-options";
import {
  QUESTION_TEMPLATES,
  type QuestionTemplate,
} from "@/lib/question-templates";
import { getEgeTestTemplate } from "@/lib/test-templates";



export type ParsedQuestion = {

  type: string;

  prompt: string;

  answerOptions: string;

  optionA: string;

  optionB: string;

  optionC: string;

  optionD: string;

  correctOption: string;

  explanation: string;

};



const VALID_TYPES = new Set(["multiple_choice", "gap_fill", "text"]);



const TYPE_ALIASES: Record<string, string> = {

  multiple_choice: "multiple_choice",

  выбор: "multiple_choice",

  "выбор из 4": "multiple_choice",

  "выбор из вариантов": "multiple_choice",

  test: "multiple_choice",

  gap_fill: "gap_fill",

  буква: "gap_fill",

  пропуск: "gap_fill",

  "одна буква": "gap_fill",

  text: "text",

  текст: "text",

  ввод: "text",

  слово: "text",

};



function parseOptionsFromRow(row: Record<string, string>): string[] {

  const pipeColumn = pick(row, [

    "варианты_ответов",

    "варианты ответов",

    "answer_options",

    "options",

    "варианты",

  ]);



  if (pipeColumn) {

    return parseOptionsList(pipeColumn);

  }



  return [

    pick(row, ["optiona", "a", "вариант_a", "вариант a", "вариантa"]),

    pick(row, ["optionb", "b", "вариант_b", "вариант b", "вариантb"]),

    pick(row, ["optionc", "c", "вариант_c", "вариант c", "вариантc"]),

    pick(row, ["optiond", "d", "вариант_d", "вариант d", "вариантd"]),

    pick(row, ["optione", "e", "вариант_e", "вариант e", "вариантe"]),

    pick(row, ["optionf", "f", "вариант_f", "вариант f", "вариантf"]),

  ].filter(Boolean);

}



export function parseQuestionsFromExcel(buffer: ArrayBuffer): {

  questions: ParsedQuestion[];

  errors: string[];

} {

  const errors: string[] = [];

  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName =
    workbook.SheetNames.find((n) =>
      ["вопросы", "questions", "лист1", "sheet1", "шаблон заданий"].includes(
        n.toLowerCase()
      )
    ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {

    defval: "",

  });



  if (rows.length === 0) {

    return { questions: [], errors: ["Файл пустой или лист без данных"] };

  }



  const questions: ParsedQuestion[] = [];



  rows.forEach((row, index) => {

    const line = index + 2;

    const prompt = pick(row, [
      "prompt",
      "вопрос",
      "question",
      "текст",
      "текст вопроса",
      "текст задания",
      "задание",
    ]);

    if (!prompt) return;



    const typeRaw = pick(row, ["type", "тип", "тип задания"]).toLowerCase() || "multiple_choice";

    const type = VALID_TYPES.has(typeRaw)

      ? typeRaw

      : (TYPE_ALIASES[typeRaw] ?? "multiple_choice");



    const correctRaw = pick(row, [
      "correct",
      "correctoption",
      "правильный",
      "правильный ответ",
      "ответ",
      "correct_option",
    ]);



    if (!correctRaw) {

      errors.push(`Строка ${line}: не указан правильный ответ (колонка «правильный»)`);

      return;

    }



    const options = parseOptionsFromRow(row);



    if (type === "multiple_choice") {

      if (options.length < 2) {

        errors.push(
          `Строка ${line}: укажите минимум 2 варианта в колонке «варианты» через |`
        );

        return;

      }



      if (options.length > CHOICE_LETTERS.length) {

        errors.push(

          `Строка ${line}: слишком много вариантов (максимум ${CHOICE_LETTERS.length})`

        );

        return;

      }



      const letter = resolveMultipleChoiceCorrect(options, correctRaw);

      if (!letter) {
        errors.push(
          `Строка ${line}: для выбора укажите букву (A, B, C…) или точный текст правильного варианта`
        );
        return;
      }

      const letterIndex = CHOICE_LETTERS.indexOf(letter as (typeof CHOICE_LETTERS)[number]);
      if (letterIndex < 0 || letterIndex >= options.length) {
        errors.push(
          `Строка ${line}: правильный ответ «${correctRaw}» не подходит к числу вариантов (${options.length})`
        );
        return;
      }

      const spread = optionsToFields(options);

      questions.push({
        type,
        prompt,
        answerOptions: spread.answerOptions,
        optionA: spread.optionA,
        optionB: spread.optionB,
        optionC: spread.optionC,
        optionD: spread.optionD,
        correctOption: letter,
        explanation: pick(row, ["explanation", "пояснение", "объяснение"]),
      });
      return;
    }

    const spread = optionsToFields(options);



    questions.push({

      type,

      prompt,

      answerOptions: spread.answerOptions,

      optionA: spread.optionA,

      optionB: spread.optionB,

      optionC: spread.optionC,

      optionD: spread.optionD,

      correctOption: normalizeCorrectAnswer(type, correctRaw),

      explanation: pick(row, ["explanation", "пояснение", "объяснение"]),

    });

  });



  if (questions.length === 0) {

    errors.push(

      "Не найдено ни одного вопроса. Заполните колонку «вопрос» — каждая строка это одно задание"

    );

  }



  return { questions, errors };

}



function pick(row: Record<string, string>, keys: string[]): string {

  const normalized = Object.fromEntries(

    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v ?? "").trim()])

  );

  for (const key of keys) {

    const val = normalized[key.toLowerCase()];

    if (val) return val;

  }

  return "";

}



const TEACHER_SHEET_EXAMPLES = [
  {
    type: "multiple_choice",
    question: "В каком слове пропущена буква И?",
    options: "пр...лестный | об...дать | с...грать | п...сать | к...рмить",
    correct: "п...сать",
    explanation:
      "Прелестный (прелесть — Е), обедать (обед — Е), сиграть (после приставки на согласную И → Ы), писать (пишет — И).",
  },
  {
    type: "gap_fill",
    question: "Вставьте пропущенную букву в слове: ц...плёнок",
    options: "",
    correct: "ы",
    explanation: "Слово «цыплёнок» — исключение из правила «И/Ы после Ц».",
  },
  {
    type: "text",
    question: "Напишите слово «(не)настный» без скобок, раскрыв орфограмму.",
    options: "",
    correct: "ненастный",
    explanation:
      "Прилагательное «ненастный» без «не» не употребляется, поэтому пишется слитно.",
  },
  {
    type: "text",
    question: "Раскройте скобки: по()одиночке",
    options: "",
    correct: "поодиночке | по одиночке",
    explanation:
      "Наречие «поодиночке» пишется слитно. Можно указать оба варианта через |.",
  },
] as const;

function padTemplateRow(cells: string[], width = 13): string[] {
  const row = [...cells];
  while (row.length < width) row.push("");
  return row;
}

function buildTeacherTemplateSheet(): string[][] {
  const [mc, gap, text1, text2] = TEACHER_SHEET_EXAMPLES;

  return [
    padTemplateRow(["тип", "вопрос", "варианты_ответов", "правильный", "пояснение"]),
    padTemplateRow([
      mc.type,
      mc.question,
      mc.options,
      mc.correct,
      mc.explanation,
      "",
      "",
      "",
      "Шпаргалка по заполнению шаблона для учителя:",
    ]),
    padTemplateRow([gap.type, gap.question, gap.options, gap.correct, gap.explanation]),
    padTemplateRow([
      text1.type,
      text1.question,
      text1.options,
      text1.correct,
      text1.explanation,
      "",
      "",
      "",
      "тип",
      "Что писать в эту колонку?",
      "",
      "Пример",
    ]),
    padTemplateRow([
      text2.type,
      text2.question,
      text2.options,
      text2.correct,
      text2.explanation,
      "",
      "",
      "",
      "multiple_choice",
      "Тест с выбором ответа. Варианты — в колонку «варианты_ответов» через | (можно с пробелами). В «правильный» — точный текст верного варианта или буква A, B, C…",
      "",
      "п...сать",
    ]),
    padTemplateRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "gap_fill",
      "Вставка буквы. В «правильный» — только буква. Колонку «варианты_ответов» оставьте пустой.",
      "",
      "ы",
    ]),
    padTemplateRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "text",
      "Открытый ответ. Несколько допустимых написаний — через | в колонке «правильный».",
      "",
      "ненастный",
    ]),
  ];
}

function teacherInstructionRows(): string[][] {
  return [
    ["СФЕРА — как заполнить шаблон"],
    [""],
    ["1. Заполняйте только колонки A–E."],
    ["2. Шпаргалка справа (колонки I–L) — подсказка, импорт её не читает."],
    ["3. Каждая строка с текстом в «вопрос» — одно задание."],
    ["4. Сохраните файл → СФЕРА → Новое задание → «Из Excel» → «Создать»."],
  ];
}

/** Категории банка готовых заданий (файлы в templates/excel-bank/) */
export const QUESTION_BANK_CATEGORIES = [
  {
    id: "orthography",
    fileName: "01-orthography",
    label: "Орфография",
    ege: "Тексты с пропущенными буквами",
    hint: "Задания с выбором слова / буквы. Для кнопки «Готовые» при категории «Орфография».",
  },
  {
    id: "task-9",
    fileName: "02-task-9",
    label: "Задание 9",
    ege: "Корни и чередования",
    hint: "Корни, чередующиеся гласные. Категория «Задание 9».",
  },
  {
    id: "adverbs",
    fileName: "03-adverbs",
    label: "Наречия",
    ege: "Задание 14",
    hint: "Наречия, слитное/раздельное написание. Категория «Наречия».",
  },
  {
    id: "task-4",
    fileName: "04-task-4",
    label: "Задание 4",
    ege: "Лексика",
    hint: "Лексическое значение, синонимы, переносный смысл. Категория «Задание 4».",
  },
  {
    id: "task-7-8",
    fileName: "05-task-7-8",
    label: "Задания 7–8",
    ege: "Грамматика",
    hint: "Грамматические ошибки, местоимения, согласование. Категория «Задание 7 и 8».",
  },
] as const;

function templateToExcelRow(q: QuestionTemplate) {
  const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
  return {
    тип: q.type ?? "multiple_choice",
    вопрос: q.prompt,
    варианты_ответов: options.join(" | "),
    правильный: q.correctOption,
    пояснение: q.explanation,
  };
}

type ExcelColWidth = { wch: number };

function colWidths(...widths: number[]): ExcelColWidth[] {
  return widths.map((wch) => ({ wch }));
}

function writeQuestionWorkbook(
  questions: ReturnType<typeof templateToExcelRow>[],
  extraSheets: { name: string; rows: string[][]; cols?: ExcelColWidth[] }[]
): ArrayBuffer {
  const questionSheet = XLSX.utils.json_to_sheet(questions);
  questionSheet["!cols"] = colWidths(16, 52, 48, 16, 38);
  questionSheet["!views"] = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, questionSheet, "Вопросы");

  for (const sheet of extraSheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!cols"] = sheet.cols ?? colWidths(72);
    XLSX.utils.book_append_sheet(book, ws, sheet.name);
  }

  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function categoryInstructionRows(category: (typeof QUESTION_BANK_CATEGORIES)[number]): string[][] {
  return [
    [`Банк вопросов: ${category.label}`],
    [""],
    [`Тема ЕГЭ: ${category.ege}`],
    [category.hint],
    [""],
    ["Добавьте сюда 10–30 вопросов (каждая строка на листе «Вопросы» — один вопрос)."],
    ["Примеры в файле можно удалить или оставить как образец."],
    [""],
    ...teacherInstructionRows().slice(2),
  ];
}

export function generateCategoryBankWorkbook(
  categoryId: (typeof QUESTION_BANK_CATEGORIES)[number]["id"]
): ArrayBuffer {
  const category = QUESTION_BANK_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    throw new Error(`Unknown category: ${categoryId}`);
  }

  const templates = QUESTION_TEMPLATES[categoryId] ?? [];
  const questions = templates.map(templateToExcelRow);

  return writeQuestionWorkbook(questions, [
    {
      name: "Как пользоваться",
      rows: categoryInstructionRows(category),
      cols: colWidths(14, 12, 48, 40),
    },
  ]);
}

export function generateEgeTestWorkbook(): ArrayBuffer {
  const { questions } = getEgeTestTemplate();
  const rows = questions.map(templateToExcelRow);

  return writeQuestionWorkbook(rows, [
    {
      name: "Как пользоваться",
      rows: [
        ["Пробный вариант ЕГЭ (~12 вопросов)"],
        [""],
        ["Смешение тем: орфография, задания 4, 7–8, 9, наречия."],
        ["Используйте при создании теста → «Из Excel» или как образец для «Вариант ЕГЭ»."],
        [""],
        ...teacherInstructionRows().slice(2),
      ],
      cols: colWidths(14, 12, 48, 40),
    },
  ]);
}

export function generateExcelTemplate(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(buildTeacherTemplateSheet());
  ws["!cols"] = colWidths(16, 42, 48, 22, 36, 3, 3, 3, 18, 52, 3, 18);
  ws["!views"] = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, "Шаблон заданий");
  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

