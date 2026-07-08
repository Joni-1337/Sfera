import * as XLSX from "xlsx";

import {
  CHOICE_LETTERS,
  normalizeChoiceLetter,
  normalizeCorrectAnswer,
  optionsToFields,
  parseOptionsList,
  serializeOptionsList,
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

  text: "text",

  текст: "text",

  ввод: "text",

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

      ["вопросы", "questions", "лист1", "sheet1"].includes(n.toLowerCase())

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

    const prompt = pick(row, ["prompt", "вопрос", "question", "текст"]);

    if (!prompt) return;



    const typeRaw = pick(row, ["type", "тип"]).toLowerCase() || "multiple_choice";

    const type = VALID_TYPES.has(typeRaw)

      ? typeRaw

      : (TYPE_ALIASES[typeRaw] ?? "multiple_choice");



    const correctRaw = pick(row, [

      "correct",

      "correctoption",

      "правильный",

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

          `Строка ${line}: укажите минимум 2 варианта в колонке «варианты_ответов» через |`

        );

        return;

      }



      if (options.length > CHOICE_LETTERS.length) {

        errors.push(

          `Строка ${line}: слишком много вариантов (максимум ${CHOICE_LETTERS.length})`

        );

        return;

      }



      const letter = normalizeChoiceLetter(correctRaw);

      if (!letter) {

        errors.push(

          `Строка ${line}: для типа «выбор» укажите букву, цифру или русскую букву (A, 1, А, а…)`

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



function instructionRows(): string[][] {
  return [
    ["Как заполнить шаблон вопросов"],
    [""],
    ["1. Каждая строка на листе «Вопросы» — один вопрос."],
    ["2. Не удаляйте и не переименовывайте заголовки в первой строке."],
    ["3. Колонка «вопрос» и «правильный» обязательны."],
    [""],
    ["Типы вопросов (колонка «тип»):"],
    ["  multiple_choice — выбор из вариантов (колонка «варианты_ответов»)"],
    ["  gap_fill — пропущенная буква (правильный = одна буква)"],
    ["  text — ввод слова или фразы (варианты не нужны)"],
    [""],
    ["Колонка «варианты_ответов»:"],
    ["  Все варианты в одной ячейке, через символ | (вертикальная черта)."],
    ["  Пример: пр…лестный|об…дать|с…грать|п…сать|к…рмить"],
    ["  Поддерживается от 2 до 9 вариантов."],
    [""],
    ["Колонка «правильный» — регистр и язык не важны:"],
    ["  Выбор: A, a, 1, А, а — все означают первый вариант"],
    ["  Несколько допустимых ответов для text/gap_fill: слово1|слово2"],
    [""],
    ["Старый формат с колонками вариант_a … вариант_d тоже поддерживается."],
    [""],
    ["Примеры правильного ответа:"],
    ["  Выбор из 5 вариантов: A или 1 или А"],
    ["  Пропуск: е"],
    ["  Текст: безграмотный"],
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

function categoryGuideRows(): string[][] {
  return [
    ["Какие файлы для чего"],
    [""],
    ["Файл", "Категория в приложении", "Тема ЕГЭ", "Назначение"],
    ...QUESTION_BANK_CATEGORIES.map((c) => [
      `${c.fileName}.xlsx`,
      c.label,
      c.ege,
      c.hint,
    ]),
    [""],
    ["06-ege-test-variant.xlsx", "—", "Пробный вариант", "Полный тест (~12 вопросов). Создание теста → «Вариант ЕГЭ» или «Из Excel»."],
    [""],
    ["Тексты для чтения", "—", "Задания 1–3", "Не через Excel: раздел «Тексты» → «Добавить текст»."],
    ["Сложные слова", "—", "Орфография", "Раздел «Словарь» → «Импорт из Excel» или добавление по одному."],
    [""],
    ["Как загрузить в приложение:"],
    ["1. Заполните нужный файл (каждая строка — один вопрос)."],
    ["2. Группа → Новое задание (или Новый тест)."],
    ["3. Выберите категорию из таблицы выше."],
    ["4. Режим «Из Excel» → загрузите файл → «Создать»."],
    ["5. Опубликуйте задание, чтобы ученики его увидели."],
  ];
}

function templateToExcelRow(q: QuestionTemplate) {
  const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
  return {
    тип: q.type ?? "multiple_choice",
    вопрос: q.prompt,
    варианты_ответов: options.join("|"),
    правильный: q.correctOption,
    пояснение: q.explanation,
  };
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
    ...instructionRows().slice(2),
  ];
}

function writeQuestionWorkbook(
  questions: ReturnType<typeof templateToExcelRow>[],
  extraSheets: { name: string; rows: string[][] }[]
): ArrayBuffer {
  const questionSheet = XLSX.utils.json_to_sheet(questions);
  questionSheet["!cols"] = [
    { wch: 18 },
    { wch: 45 },
    { wch: 55 },
    { wch: 22 },
    { wch: 40 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, questionSheet, "Вопросы");

  for (const sheet of extraSheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!cols"] = [{ wch: 72 }];
    XLSX.utils.book_append_sheet(book, ws, sheet.name);
  }

  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
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
    { name: "Инструкция", rows: categoryInstructionRows(category) },
  ]);
}

export function generateEgeTestWorkbook(): ArrayBuffer {
  const { questions } = getEgeTestTemplate();
  const rows = questions.map(templateToExcelRow);

  return writeQuestionWorkbook(rows, [
    {
      name: "Инструкция",
      rows: [
        ["Пробный вариант ЕГЭ (~12 вопросов)"],
        [""],
        ["Смешение тем: орфография, задания 4, 7–8, 9, наречия."],
        ["Используйте при создании теста → «Из Excel» или как образец для «Вариант ЕГЭ»."],
        ["Можно сделать несколько файлов: variant-1.xlsx, variant-2.xlsx и т.д."],
        [""],
        ...instructionRows().slice(2),
      ],
    },
  ]);
}

export function generateExcelTemplate(): ArrayBuffer {
  const questions = [
    {
      тип: "multiple_choice",
      вопрос: "В каком слове пропущена буква И?",
      варианты_ответов: "пр…лестный|об…дать|с…грать|п…сать|к…рмить",
      правильный: "A",
      пояснение: "Прелестный — проверочное слово «прелесть»",
    },
    {
      тип: "gap_fill",
      вопрос: "Вставьте пропущенную букву: пр…лестный",
      варианты_ответов: "",
      правильный: "е",
      пояснение: "Корень -елест- (прелесть)",
    },
    {
      тип: "text",
      вопрос: "Напишите слово: без…мотный (слитно)",
      варианты_ответов: "",
      правильный: "грамотный",
      пояснение: "Безграмотный пишется слитно",
    },
    {
      тип: "text",
      вопрос: "Допустимы оба написания (пример)",
      варианты_ответов: "",
      правильный: "безграмотный|без грамотный",
      пояснение: "Можно указать несколько ответов через |",
    },
  ];

  return writeQuestionWorkbook(questions, [
    { name: "Инструкция", rows: instructionRows() },
    { name: "Категории", rows: categoryGuideRows() },
  ]);
}

