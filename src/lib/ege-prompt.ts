const EGE_PROMPT_RE = /^\[Вариант\s+(\d+),\s*Задание\s+(\d+)\]\s*/i;

export type ParsedEgePrompt = {
  variantNumber: number | null;
  taskNumber: number | null;
  text: string;
};

export function parseEgePrompt(prompt: string): ParsedEgePrompt {
  const match = prompt.match(EGE_PROMPT_RE);
  if (!match) {
    return { variantNumber: null, taskNumber: null, text: prompt.trim() };
  }

  return {
    variantNumber: Number(match[1]),
    taskNumber: Number(match[2]),
    text: prompt.slice(match[0].length).trim(),
  };
}

export function normalizeEgePrompt(prompt: string): string {
  return parseEgePrompt(prompt).text;
}

export function getEgeVariantLabel(
  questions: Array<{ prompt: string }>
): string | null {
  for (const question of questions) {
    const { variantNumber } = parseEgePrompt(question.prompt);
    if (variantNumber != null) return `Вариант ${variantNumber}`;
  }
  return null;
}

export function formatQuestionLabel(
  prompt: string,
  fallbackIndex: number
): { number: number; text: string } {
  const parsed = parseEgePrompt(prompt);
  return {
    number: parsed.taskNumber ?? fallbackIndex,
    text: parsed.text,
  };
}

const READING_REF_RE = /^Текст для задан/i;

export type EgeQuestionParts = {
  reference: string | null;
  question: string;
  body: string | null;
  context: string | null;
};

function stripTaskPrefix(text: string): string {
  return text.replace(/^Задание\s+\d+\.\s*/i, "").trim();
}

function splitQuestionAndBody(text: string): { question: string; body: string | null } {
  const stripped = stripTaskPrefix(text);
  const splitIndex = stripped.indexOf("\n\n");

  if (splitIndex === -1) {
    return { question: stripped, body: null };
  }

  const question = stripped.slice(0, splitIndex).trim();
  const body = stripped.slice(splitIndex).trim();

  return {
    question,
    body: body || null,
  };
}

function splitReference(instruction: string): { reference: string | null; body: string } {
  const parts = instruction.split(/\n\n+/);
  if (parts[0] && READING_REF_RE.test(parts[0].trim())) {
    return {
      reference: parts[0].trim(),
      body: parts.slice(1).join("\n\n").trim(),
    };
  }
  return { reference: null, body: instruction };
}

/** Разделяет формулировку задания и текст для чтения (как в вариантах ЕГЭ). */
export function splitEgeQuestionDisplay(prompt: string): {
  instruction: string;
  context: string | null;
} {
  const normalized = prompt.trim();
  const taskIndex = normalized.search(/Задание\s+\d+\./);

  if (taskIndex === -1) {
    return { instruction: normalized, context: null };
  }

  const before = normalized.slice(0, taskIndex).trim();
  const instruction = normalized.slice(taskIndex).trim();

  if (!before || READING_REF_RE.test(before)) {
    return {
      instruction: before ? `${before}\n\n${instruction}` : instruction,
      context: null,
    };
  }

  return { instruction, context: before };
}

/** Части задания для отображения: ссылка, вопрос, варианты, текст для чтения. */
export function parseEgeQuestionParts(prompt: string): EgeQuestionParts {
  const { instruction, context } = splitEgeQuestionDisplay(prompt);
  const { reference, body: instructionBody } = splitReference(instruction);
  const { question, body } = splitQuestionAndBody(instructionBody);

  return {
    reference,
    question,
    body,
    context,
  };
}
