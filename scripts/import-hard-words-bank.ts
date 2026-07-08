import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { HARD_WORD_TOPICS } from "../src/lib/hard-word-constants";
import { prepareHardWordFields } from "../src/lib/hard-words-utils";

const DESKTOP_FILE = "c:/Users/mixal/OneDrive/Рабочий стол/ege_top_50_final.xlsx";
const SOURCE_DIR = path.join(process.cwd(), "templates", "excel-bank", "source");
const DATA_FILE = path.join(process.cwd(), "src", "data", "hard-words", "ege-top-50.json");

const TOPIC_ALIASES: Record<string, string> = Object.fromEntries(
  HARD_WORD_TOPICS.flatMap((t) => [
    [t.id.toLowerCase(), t.id],
    [t.label.toLowerCase(), t.id],
  ])
);

type Row = Record<string, string>;

function pick(row: Row, keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v ?? "").trim()])
  );
  for (const key of keys) {
    const value = normalized[key.toLowerCase()];
    if (value) return value;
  }
  return "";
}

function parseTopic(raw: string): string | null {
  return TOPIC_ALIASES[raw.toLowerCase().trim()] ?? null;
}

function parseRow(row: Row) {
  const word = pick(row, [
    "слово",
    "word",
    "слово / языковая единица",
    "слово/языковая единица",
  ]);
  const topicRaw = pick(row, ["тема", "topic", "раздел языкознания"]);
  const definition = pick(row, [
    "значение",
    "definition",
    "правило",
    "пояснение",
    "правило / ловушка на экзамене",
    "правило/ловушка на экзамене",
  ]);
  const example = pick(row, ["пример", "example", "контекстный пример"]);

  if (!word || !topicRaw || !definition) return null;

  const topic = parseTopic(topicRaw);
  if (!topic) {
    throw new Error(`Неизвестная тема «${topicRaw}» для слова «${word}»`);
  }

  return { topic, ...prepareHardWordFields(word, definition, example) };
}

function parseWorkbook(filePath: string) {
  const wb = XLSX.read(fs.readFileSync(filePath));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });

  const words = rows.map(parseRow).filter(Boolean) as Array<{
    topic: string;
    word: string;
    definition: string;
    example: string;
  }>;

  if (words.length === 0) {
    throw new Error("Не найдено ни одного слова в файле");
  }

  return words;
}

function main() {
  const sourcePath = fs.existsSync(DESKTOP_FILE)
    ? DESKTOP_FILE
    : path.join(SOURCE_DIR, "ege_top_50_final.xlsx");

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Файл не найден: ${sourcePath}`);
  }

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

  if (sourcePath !== path.join(SOURCE_DIR, "ege_top_50_final.xlsx")) {
    fs.copyFileSync(sourcePath, path.join(SOURCE_DIR, "ege_top_50_final.xlsx"));
    console.log("Скопировано в templates/excel-bank/source/ege_top_50_final.xlsx");
  }

  const words = parseWorkbook(sourcePath);
  fs.writeFileSync(DATA_FILE, JSON.stringify(words, null, 2) + "\n", "utf-8");

  console.log(`Импортировано ${words.length} слов → ${DATA_FILE}`);
}

main();
