import fs from "node:fs";
import path from "node:path";
import { maskOrthographyOption } from "../src/lib/mask-orthography-option";

type AdverbQuestion = {
  type: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

const filePath = path.join(process.cwd(), "src/data/question-bank/adverbs.json");
const questions = JSON.parse(fs.readFileSync(filePath, "utf8")) as AdverbQuestion[];

let updated = 0;

for (const question of questions) {
  for (const key of ["optionA", "optionB", "optionC", "optionD"] as const) {
    const raw = question[key];
    if (!raw?.trim()) continue;

    const masked = maskOrthographyOption(raw);
    if (masked !== raw) {
      question[key] = masked;
      updated++;
    }
  }
}

fs.writeFileSync(filePath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");

console.log(`Updated ${updated} option(s) in ${questions.length} adverb questions.`);
