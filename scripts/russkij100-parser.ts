import * as cheerio from "cheerio";

export type ParsedRusskij100Question = {
  orderIndex: number;
  type: "text" | "ege_numbers" | "multiple_choice" | "gap_fill";
  prompt: string;
  answerOptions: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

export type ParsedRusskij100Variant = {
  sourceId: number;
  title: string;
  questions: ParsedRusskij100Question[];
};

export type ParsedRusskij100TestRef = {
  sourceId: number;
  title: string;
};

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToPlain(html: string): string {
  if (!html.trim()) return "";
  const $ = cheerio.load(html);
  $("br").replaceWith("\n");
  $("p").each((_, el) => {
    $(el).prepend("\n");
    $(el).append("\n");
  });
  return decodeHtml($("body").text())
    .replace(/\u00AD/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isNumberSetAnswer(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length > 0 && /^[\d\s]+$/.test(trimmed);
}

function mapQuestionType(rawType: string, correct: string): ParsedRusskij100Question["type"] {
  if (rawType === "Plain") return "text";
  if (rawType === "TypeAll" || isNumberSetAnswer(correct)) return "ege_numbers";
  return "text";
}

function normalizeSlashAlternatives(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.includes("/")) return trimmed;
  return trimmed
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("|");
}

export function parseFolderTests(html: string): ParsedRusskij100TestRef[] {
  const $ = cheerio.load(html);
  const tests: ParsedRusskij100TestRef[] = [];

  $(".test[data-id]").each((_, el) => {
    const sourceId = Number.parseInt($(el).attr("data-id") ?? "", 10);
    const title =
      $(el).find("a.test-title span").first().text().trim() ||
      $(el).find(".test-title").first().text().trim();
    if (Number.isFinite(sourceId) && title) {
      tests.push({ sourceId, title });
    }
  });

  return tests;
}

export function parseAnswerKey(html: string): Map<number, string> {
  const $ = cheerio.load(html);
  const answers = new Map<number, string>();

  $(".test-answers-table tr").each((_, row) => {
    const numberText = $(row).find(".question-number-cell").text().replace(".", "").trim();
    const answer = $(row).find(".theAnswer-cell").text().trim();
    const number = Number.parseInt(numberText, 10);
    if (Number.isFinite(number) && answer) {
      answers.set(number, answer);
    }
  });

  return answers;
}

export function parseTestPage(html: string, answerKey: Map<number, string>): ParsedRusskij100Question[] {
  const $ = cheerio.load(html);
  const passages = new Map<number, string>();

  $(".extraTextBefore-cont").each((_, block) => {
    const numbersRaw = $(block).attr("data-question-numbers") ?? "";
    const numbers = numbersRaw
      .split(",")
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((n) => Number.isFinite(n));
    const passage = htmlToPlain(
      $(block).find(".bigTextMessage, .freebirdFormviewerComponentsQuestionBaseDescription").html() ?? ""
    );
    if (!passage || numbers.length === 0) return;
    for (const number of numbers) {
      passages.set(number, passage);
    }
  });

  const questions: ParsedRusskij100Question[] = [];

  $(".question-cont[data-question-number]").each((_, el) => {
    const number = Number.parseInt($(el).attr("data-question-number") ?? "", 10);
    const rawType = $(el).attr("data-question-type") ?? "Plain";
    if (!Number.isFinite(number)) return;

    const title = $(el).find(".question-title-cont").first().text().trim();
    const messageHtml = $(el).find(".question-message").first().html() ?? "";
    const message = htmlToPlain(messageHtml);
    const passage = passages.get(number);

    let prompt = `Задание ${number}. ${title}`.trim();
    if (passage) {
      prompt = `${passage}\n\n${prompt}`;
    } else if (number > 1 && passages.has(1) && number <= 3) {
      prompt = `(Используйте текст из задания 1.)\n\n${prompt}`;
    }
    if (message) {
      prompt = `${prompt}\n\n${message}`;
    }

    const correctRaw = answerKey.get(number) ?? "";
    const type = mapQuestionType(rawType, correctRaw);
    const correctOption =
      type === "ege_numbers"
        ? correctRaw.trim().replace(/\s+/g, " ")
        : normalizeSlashAlternatives(correctRaw).toLowerCase();

    questions.push({
      orderIndex: number - 1,
      type,
      prompt,
      answerOptions: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption,
      explanation: "",
    });
  });

  return questions.sort((a, b) => a.orderIndex - b.orderIndex);
}
