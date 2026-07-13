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



function typeToTeacherLabel(type?: string): string {
  if (!type || type === "multiple_choice") return "выбор";
  if (type === "gap_fill") return "буква";
  if (type === "text") return "текст";
  return type;
}

/** Примеры заданий для скачиваемого шаблона (можно копировать и менять). */
const TEACHER_TEMPLATE_EXAMPLES: Array<{
  тип: string;
  вопрос: string;
  варианты: string;
  правильный: string;
  пояснение: string;
}> = [
  {
    тип: "выбор",
    вопрос: "В каком слове на месте пропуска пишется буква А?",
    варианты: "р...стительный|р...сток|отр...сль|выр...щенный",
    правильный: "A",
    пояснение: "В корне -раст-/-ращ- перед -ст- и -щ- пишется А (растительный, выращенный).",
  },
  {
    тип: "выбор",
    вопрос: "В каком слове пропущена чередующаяся гласная О?",
    варианты: "прил...гать|прил...жение|кас...ться|заг...рать",
    правильный: "B",
    пояснение: "Перед Ж пишется О (приложение), перед Г — А (прилагать).",
  },
  {
    тип: "выбор",
    вопрос: "В каком слове на месте пропуска пишется буква О?",
    варианты: "з...рница|озарение|з...рька|з...ря",
    правильный: "C",
    пояснение: "Под ударением — та гласная, что слышится (зорька), без ударения — А.",
  },
  {
    тип: "выбор",
    вопрос: "Укажите слово с правильным написанием приставки без-/бес-:",
    варианты: "бесграмотный|безответственный|бесвкусный|расжимать",
    правильный: "B",
    пояснение: "Приставка без- перед гласными и звонкими согласными.",
  },
  {
    тип: "выбор",
    вопрос: "В каком слове пишется ровно одна буква Н?",
    варианты: "деревянный|стеклянный|оловянный|кожаный",
    правильный: "D",
    пояснение: "В суффиксе -ан-/-ян- одна Н (кожаный). Остальные — исключения с НН.",
  },
  {
    тип: "выбор",
    вопрос: "В каком предложении допущена грамматическая ошибка?",
    варианты: "Пара носков|Около пятиста рублей|Поезжайте домой|Их вещи",
    правильный: "B",
    пояснение: "Род. падеж для «пятьсот» — пятисот, а не пятиста.",
  },
  {
    тип: "выбор",
    вопрос: "В каком предложении слово употреблено в переносном значении?",
    варианты: "Ручка двери сломалась|Купи ручку для письма|Ручка речки извивается|Ребёнок протянул ручку",
    правильный: "C",
    пояснение: "«Ручка речки» — переносное значение (рукав, приток).",
  },
  {
    тип: "выбор",
    вопрос: "Укажите наречие, которое пишется раздельно:",
    варианты: "навсегда|наверх|на ходу|направо",
    правильный: "C",
    пояснение: "«На ходу» — наречное сочетание, пишется раздельно.",
  },
  {
    тип: "буква",
    вопрос: "Вставьте пропущенную букву: пр...лестный",
    варианты: "",
    правильный: "е",
    пояснение: "Корень -лест- (прелесть).",
  },
  {
    тип: "буква",
    вопрос: "Вставьте пропущенную букву: прик...снуться",
    варианты: "",
    правильный: "о",
    пояснение: "Корень -кас-/-кос-: перед -ну- пишется О.",
  },
  {
    тип: "буква",
    вопрос: "Вставьте букву на стыке приставки и корня: под...тожить",
    варианты: "",
    правильный: "ы",
    пояснение: "После приставки на согласный И → Ы.",
  },
  {
    тип: "текст",
    вопрос: "Напишите слово целиком, исправив ошибку в приставке: бисполезный",
    варианты: "",
    правильный: "бесполезный",
    пояснение: "Перед глухим согласным — приставка бес-.",
  },
  {
    тип: "текст",
    вопрос: "Исправьте речевую ошибку (плеоназм): главная суть",
    варианты: "",
    правильный: "суть",
    пояснение: "«Главная суть» — плеоназм, достаточно «суть».",
  },
  {
    тип: "текст",
    вопрос: "Как пишется: «(не)когда» — слитно или раздельно?",
    варианты: "",
    правильный: "некогда",
    пояснение: "В значении «нет времени» — слитно.",
  },
];

function teacherInstructionRows(): string[][] {
  return [
    ["СФЕРА — шаблон для загрузки заданий"],
    [""],
    ["БЫСТРЫЙ СТАРТ"],
    ["1. Откройте лист «Вопросы» (вкладка внизу окна Excel)."],
    ["2. Каждая строка — одно задание. Примеры можно удалить или скопировать как образец."],
    ["3. Заполните свои задания и сохраните файл (.xlsx)."],
    ["4. В СФЕРА: Новое задание → «Из Excel» → загрузите файл → «Создать»."],
    [""],
    ["КОЛОНКИ НА ЛИСТЕ «ВОПРОСЫ» (первую строку не удаляйте и не переименовывайте)"],
    ["Колонка", "Нужно?", "Что писать", "Пример"],
    [
      "тип",
      "нет",
      "выбор — ученик выбирает из списка; буква — вводит одну букву; текст — вводит слово. Пусто = выбор",
      "выбор",
    ],
    ["вопрос", "ДА", "Формулировка задания для ученика", "В каком слове пропущена буква А?"],
    [
      "варианты",
      "для выбора",
      "Все варианты в одной ячейке через символ | (вертикальная черта). От 2 до 9 вариантов",
      "слово1|слово2|слово3|слово4",
    ],
    [
      "правильный",
      "ДА",
      "Для «выбор»: A — 1-й вариант, B — 2-й, C — 3-й… (можно А, а, 1, 2). Для «буква» и «текст» — сам ответ",
      "A",
    ],
    ["пояснение", "нет", "Разбор — ученик увидит после сдачи", "В корне -раст- пишется А"],
    [""],
    ["КАК ПИСАТЬ ВАРИАНТЫ (колонка «варианты»)"],
    ["  В одной ячейке, через | :  пр…лестный|об…дать|с…грать|п…сать"],
    ["  Символ | на клавиатуре: Shift + \\ (или отдельная клавиша на цифровом блоке)."],
    [""],
    ["ТИПЫ ЗАДАНИЙ (колонка «тип»)"],
    ["  выбор  — ученик отмечает один из вариантов (самый частый тип для орфографии)"],
    ["  буква  — ученик вводит одну пропущенную букву (колонку «варианты» оставьте пустой)"],
    ["  текст  — ученик вводит слово или короткую фразу (колонку «варианты» оставьте пустой)"],
    [""],
    ["НЕСКОЛЬКО ДОПУСТИМЫХ ОТВЕТОВ"],
    ["  Для типов «буква» и «текст» можно указать:  слово1|слово2"],
    [""],
    ["ПРИМЕРЫ"],
    ["  На листе «Вопросы» уже есть 14 готовых заданий по разным темам ЕГЭ."],
    ["  Скопируйте строку, измените текст — и добавьте своё задание."],
  ];
}

function instructionRows(): string[][] {
  return teacherInstructionRows();
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
    тип: typeToTeacherLabel(q.type),
    вопрос: q.prompt,
    варианты: options.join("|"),
    правильный: q.correctOption,
    пояснение: q.explanation,
  };
}

function writeQuestionWorkbook(
  questions: ReturnType<typeof templateToExcelRow>[],
  extraSheets: { name: string; rows: string[][]; cols?: number[] }[],
  options?: { freezeHeader?: boolean }
): ArrayBuffer {
  const questionSheet = XLSX.utils.json_to_sheet(questions);
  questionSheet["!cols"] = [
    { wch: 10 },
    { wch: 52 },
    { wch: 50 },
    { wch: 14 },
    { wch: 38 },
  ];

  if (options?.freezeHeader && questions.length > 0) {
    questionSheet["!views"] = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
    questionSheet["!autofilter"] = {
      ref: `A1:E${questions.length + 1}`,
    };
  }

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, questionSheet, "Вопросы");

  for (const sheet of extraSheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!cols"] = sheet.cols ?? [{ wch: 72 }];
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
    { name: "Как пользоваться", rows: categoryInstructionRows(category), cols: [14, 12, 48, 40] },
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
      cols: [14, 12, 48, 40],
    },
  ]);
}

export function generateExcelTemplate(): ArrayBuffer {
  return writeQuestionWorkbook(
    TEACHER_TEMPLATE_EXAMPLES,
    [
      {
        name: "Как пользоваться",
        rows: teacherInstructionRows(),
        cols: [14, 12, 48, 40],
      },
    ],
    { freezeHeader: true }
  );
}

