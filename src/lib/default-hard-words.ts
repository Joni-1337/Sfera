import defaultHardWords from "@/data/hard-words/ege-top-50.json";
import { prisma } from "@/lib/prisma";
import { cleanHardWordAnswer } from "@/lib/hard-words-utils";

export type DefaultHardWord = {
  topic: string;
  word: string;
  definition: string;
  example: string;
};

export const EGE_TOP_50_WORDS = defaultHardWords as DefaultHardWord[];

function wordKey(topic: string, word: string) {
  return `${topic}\0${cleanHardWordAnswer(word).toLowerCase()}`;
}

/** Одноразовая нормализация — не вызывать на каждый запрос страницы. */
export async function normalizeTeacherHardWords(teacherId: string): Promise<number> {
  const words = await prisma.hardWord.findMany({
    where: { teacherId, word: { contains: "(" } },
    select: { id: true, word: true },
  });

  if (words.length === 0) return 0;

  await prisma.$transaction(
    words.map((item) =>
      prisma.hardWord.update({
        where: { id: item.id },
        data: { word: cleanHardWordAnswer(item.word) },
      })
    )
  );

  return words.length;
}

export async function ensureDefaultHardWords(teacherId: string): Promise<number> {
  const count = await prisma.hardWord.count({ where: { teacherId } });
  if (count >= EGE_TOP_50_WORDS.length) return 0;

  const existing = await prisma.hardWord.findMany({
    where: { teacherId },
    select: { topic: true, word: true },
  });

  const existingKeys = new Set(existing.map((w) => wordKey(w.topic, w.word)));
  const toCreate = EGE_TOP_50_WORDS.filter((w) => !existingKeys.has(wordKey(w.topic, w.word)));

  if (toCreate.length === 0) return 0;

  await prisma.hardWord.createMany({
    data: toCreate.map((w) => ({
      teacherId,
      topic: w.topic,
      word: w.word,
      definition: w.definition,
      example: w.example,
    })),
  });

  return toCreate.length;
}
