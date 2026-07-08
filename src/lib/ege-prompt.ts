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
