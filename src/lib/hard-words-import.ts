import * as XLSX from "xlsx";
import { HARD_WORD_TOPICS } from "@/lib/hard-word-constants";
import { prepareHardWordFields } from "@/lib/hard-words-utils";

export type ParsedHardWord = {
  topic: string;
  word: string;
  definition: string;
  example: string;
};

const TOPIC_ALIASES: Record<string, string> = Object.fromEntries(
  HARD_WORD_TOPICS.flatMap((t) => [
    [t.id.toLowerCase(), t.id],
    [t.label.toLowerCase(), t.id],
  ])
);

function pick(row: Record<string, string>, keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v ?? "").trim()])
  );

  for (const key of keys) {
    const value = normalized[key.toLowerCase()];
    if (value) return value;
  }

  return "";
}

function parseTopic(raw: string, line: number, errors: string[]): string | null {
  const key = raw.toLowerCase().trim();
  const topic = TOPIC_ALIASES[key];
  if (!topic) {
    errors.push(
      `Строка ${line}: неизвестная тема «${raw}». Используйте: ${HARD_WORD_TOPICS.map((t) => t.label).join(", ")}`
    );
    return null;
  }
  return topic;
}

export function parseHardWordsFromExcel(buffer: ArrayBuffer): {
  words: ParsedHardWord[];
  errors: string[];
} {
  const errors: string[] = [];
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName =
    workbook.SheetNames.find((n) =>
      ["слова", "words", "словарь", "вопросы", "questions", "лист1", "sheet1"].includes(
        n.toLowerCase()
      )
    ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return { words: [], errors: ["Файл пустой или лист без данных"] };
  }

  const words: ParsedHardWord[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const word = pick(row, [
      "word",
      "слово",
      "слово / языковая единица",
      "слово/языковая единица",
    ]);
    const topicRaw = pick(row, ["topic", "тема", "раздел языкознания"]);
    const definition = pick(row, [
      "definition",
      "значение",
      "правило",
      "пояснение",
      "правило / ловушка на экзамене",
      "правило/ловушка на экзамене",
    ]);
    const example = pick(row, ["example", "пример", "контекстный пример"]);

    if (!word && !topicRaw && !definition) return;

    if (!word) {
      errors.push(`Строка ${line}: не указано слово (колонка «слово»)`);
      return;
    }

    if (!topicRaw) {
      errors.push(`Строка ${line}: не указана тема (колонка «тема»)`);
      return;
    }

    const topic = parseTopic(topicRaw, line, errors);
    if (!topic) return;

    if (!definition) {
      errors.push(`Строка ${line}: не указано значение (колонка «значение»)`);
      return;
    }

    words.push({ topic, ...prepareHardWordFields(word, definition, example) });
  });

  if (words.length === 0 && errors.length === 0) {
    errors.push("Не найдено ни одного слова. Заполните колонки «слово», «тема» и «значение»");
  }

  return { words, errors };
}

function instructionRows(): string[][] {
  return [
    ["Импорт словаря «Сложные слова»"],
    [""],
    ["Каждая строка на листе «Слова» — одно слово для учеников."],
    ["Не удаляйте и не переименовывайте заголовки в первой строке."],
    [""],
    ["Колонки:"],
    ["  слово — обязательно (например: безграмотный)"],
    ["  тема — обязательно (см. список ниже)"],
    ["  значение — обязательно (правило, пояснение или определение)"],
    ["  пример — необязательно (предложение с этим словом)"],
    [""],
    ["Допустимые значения колонки «тема»:"],
    ...HARD_WORD_TOPICS.map((t) => [`  ${t.label}`, `или ${t.id}`]),
    [""],
    ["Как загрузить:"],
    ["1. Заполните лист «Слова» (можно удалить примеры)."],
    ["2. Словарь → «Импорт из Excel» → выберите файл → «Импортировать»."],
    [""],
    ["Английские названия колонок (word, topic, definition, example) тоже поддерживаются."],
  ];
}

export function generateHardWordsTemplate(): ArrayBuffer {
  const sampleWords = [
    {
      слово: "безграмотный",
      тема: "Орфография",
      значение: "Слитно: приставка «без-» + корень «грамот»",
      пример: "Это был безграмотный поступок.",
    },
    {
      слово: "одеть",
      тема: "Лексика",
      значение: "Одеть — кого-то (одеть ребёнка). Надеть — что-то на себя",
      пример: "Мама одела дочку в новое платье.",
    },
    {
      слово: "бегущий",
      тема: "Морфология",
      значение: "Причастие на -ущ-/-ющ- от глагола несовершенного вида",
      пример: "Бегущий по дорожке мальчик.",
    },
  ];

  const wordSheet = XLSX.utils.json_to_sheet(sampleWords);
  wordSheet["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 48 }, { wch: 40 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, wordSheet, "Слова");

  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows());
  instructionSheet["!cols"] = [{ wch: 72 }];
  XLSX.utils.book_append_sheet(book, instructionSheet, "Инструкция");

  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export const HARD_WORDS_TEMPLATE_URL = "/api/template/hard-words";
