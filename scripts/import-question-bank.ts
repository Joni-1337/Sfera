import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  normalizeCorrectAnswer,
  optionsToFields,
  parseOptionsList,
} from "../src/lib/question-options";

const DESKTOP = "c:/Users/mixal/OneDrive/Рабочий стол";
const SOURCE_DIR = path.join(process.cwd(), "templates", "excel-bank", "source");
const DATA_DIR = path.join(process.cwd(), "src", "data", "question-bank");

const ASSIGNMENT_FILES = [
  { category: "orthography", src: "ege_orthography_50_tasks.xlsx", dest: "orthography.json" },
  { category: "task-9", src: "zadanie_9_vowels_100.xlsx", dest: "task-9.json" },
  { category: "adverbs", src: "zadanie_14_adverbs_100.xlsx", dest: "adverbs.json" },
  { category: "task-4", src: "zadanie_4_lexics_100.xlsx", dest: "task-4.json" },
  { category: "task-7-8", src: "zadaniya_7_8_grammar_100.xlsx", dest: "task-7-8.json" },
] as const;

const TEST_FILE = {
  src: "ege_mixed_variants_10x12.xlsx",
  dest: "ege-variants.json",
  questionsPerVariant: 12,
} as const;

type Row = Record<string, string>;

function pick(row: Row, keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v ?? "").trim()])
  );
  for (const key of keys) {
    const val = normalized[key.toLowerCase()];
    if (val) return val;
  }
  return "";
}

function parseOptionsFromRow(row: Row): string[] {
  const pipeColumn = pick(row, [
    "варианты_ответов",
    "варианты ответов",
    "answer_options",
    "options",
    "варианты",
  ]);
  if (pipeColumn) return parseOptionsList(pipeColumn);
  return [
    pick(row, ["optiona", "a", "вариант_a", "вариант a", "вариантa"]),
    pick(row, ["optionb", "b", "вариант_b", "вариант b", "вариантb"]),
    pick(row, ["optionc", "c", "вариант_c", "вариант c", "вариантc"]),
    pick(row, ["optiond", "d", "вариант_d", "вариант d", "вариантd"]),
  ].filter(Boolean);
}

function parseWorkbook(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });

  return rows
    .map((row) => {
      const prompt = pick(row, ["prompt", "вопрос", "question", "текст"]);
      if (!prompt) return null;

      const type = pick(row, ["type", "тип"]) || "multiple_choice";
      const options = parseOptionsFromRow(row);
      const spread = optionsToFields(options);
      const correctRaw = pick(row, ["correct", "correctoption", "правильный", "ответ"]);

      return {
        type,
        prompt,
        optionA: spread.optionA,
        optionB: spread.optionB,
        optionC: spread.optionC,
        optionD: spread.optionD,
        correctOption: normalizeCorrectAnswer(type, correctRaw),
        explanation: pick(row, ["explanation", "пояснение", "объяснение"]),
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);
}

function splitTestVariants<T>(questions: T[], size: number): T[][] {
  const variants: T[][] = [];
  for (let i = 0; i < questions.length; i += size) {
    const chunk = questions.slice(i, i + size);
    if (chunk.length === size) variants.push(chunk);
  }
  return variants;
}

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const summary: string[] = [];

for (const { category, src, dest } of ASSIGNMENT_FILES) {
  const srcPath = path.join(DESKTOP, src);
  fs.copyFileSync(srcPath, path.join(SOURCE_DIR, src));
  const templates = parseWorkbook(srcPath);
  fs.writeFileSync(path.join(DATA_DIR, dest), JSON.stringify(templates, null, 2), "utf8");
  summary.push(`${category}: ${templates.length} → ${dest}`);
}

const testSrc = path.join(DESKTOP, TEST_FILE.src);
fs.copyFileSync(testSrc, path.join(SOURCE_DIR, TEST_FILE.src));
const testQuestions = parseWorkbook(testSrc);
const variants = splitTestVariants(testQuestions, TEST_FILE.questionsPerVariant);
fs.writeFileSync(path.join(DATA_DIR, TEST_FILE.dest), JSON.stringify(variants, null, 2), "utf8");
summary.push(`tests: ${variants.length} × ${TEST_FILE.questionsPerVariant} → ${TEST_FILE.dest}`);

const shablonSrc = path.join(DESKTOP, "advanced_questions_bank.xlsx");
if (fs.existsSync(shablonSrc)) {
  const templateDir = path.join(process.cwd(), "templates", "excel-bank");
  fs.copyFileSync(shablonSrc, path.join(templateDir, "advanced_questions_bank.xlsx"));
  fs.copyFileSync(shablonSrc, path.join(SOURCE_DIR, "advanced_questions_bank.xlsx"));
  summary.push("template: advanced_questions_bank.xlsx → templates/excel-bank/");
}

console.log("Import complete:\n" + summary.join("\n"));
