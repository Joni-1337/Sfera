import fs from "fs";
import path from "path";
import { validateVariantQuestions, type ParsedRusskij100Variant } from "./russkij100-parser";

const BANK_PATH = path.join(process.cwd(), "src", "data", "question-bank", "russkij100-ege-variants.json");

function passagePrefix(prompt: string): string {
  const idx = prompt.indexOf("Задание ");
  return idx > 0 ? prompt.slice(0, idx).trim() : "";
}

function taskBody(prompt: string): string {
  const idx = prompt.indexOf("Задание ");
  return idx >= 0 ? prompt.slice(idx).trim() : prompt.trim();
}

function fixVariant(variant: ParsedRusskij100Variant): ParsedRusskij100Variant {
  const prefixFirstTask = new Map<string, number>();

  const questions = variant.questions.map((question) => {
    const prefix = passagePrefix(question.prompt);
    const body = taskBody(question.prompt);
    if (!prefix || prefix.length < 80) {
      return question;
    }

    const taskMatch = body.match(/^Задание\s+(\d+)\./i);
    const taskNumber = taskMatch ? Number.parseInt(taskMatch[1], 10) : question.orderIndex + 1;
    const knownFirst = prefixFirstTask.get(prefix);

    if (knownFirst == null) {
      prefixFirstTask.set(prefix, taskNumber);
      return question;
    }

    if (taskNumber === knownFirst) {
      return question;
    }

    const groupTasks = variant.questions
      .map((q) => {
        if (passagePrefix(q.prompt) !== prefix) return null;
        const match = taskBody(q.prompt).match(/^Задание\s+(\d+)\./i);
        return match ? Number.parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n != null)
      .sort((a, b) => a - b);

    const first = groupTasks[0] ?? knownFirst;
    const last = groupTasks[groupTasks.length - 1] ?? taskNumber;
    const ref =
      first === last
        ? `Текст для задания ${first} — см. задание ${first}.`
        : `Текст для заданий ${first}–${last} — см. задание ${first}.`;

    return {
      ...question,
      prompt: `${ref}\n\n${body}`,
    };
  });

  return { ...variant, questions };
}

function main() {
  const raw = fs.readFileSync(BANK_PATH, "utf8");
  const variants = JSON.parse(raw) as ParsedRusskij100Variant[];
  const fixed = variants.map(fixVariant);

  let warnings = 0;
  for (const variant of fixed) {
    const errors = validateVariantQuestions(variant);
    if (errors.length > 0) {
      warnings++;
      console.warn(`${variant.title}: ${errors.join(", ")}`);
    }
  }

  fs.writeFileSync(BANK_PATH, JSON.stringify(fixed, null, 2), "utf8");
  console.log(`Fixed ${fixed.length} variants (${warnings} with validation warnings)`);
}

main();
