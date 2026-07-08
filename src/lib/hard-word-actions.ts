"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HARD_WORD_TOPICS } from "@/lib/hard-word-constants";
import { cleanHardWordAnswer, prepareHardWordFields } from "@/lib/hard-words-utils";

function parseTopic(topic: string) {
  return HARD_WORD_TOPICS.some((t) => t.id === topic) ? topic : null;
}

export async function importHardWordsFromExcel(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const file = formData.get("excelFile") as File | null;
  if (!file || file.size === 0) return { error: "Выберите файл Excel" };

  const { parseHardWordsFromExcel } = await import("@/lib/hard-words-import");
  const buffer = await file.arrayBuffer();
  const parsed = parseHardWordsFromExcel(buffer);

  if (parsed.words.length === 0) {
    return { error: parsed.errors.join("; ") || "Файл пустой" };
  }

  const existing = await prisma.hardWord.findMany({
    where: { teacherId: session.id },
    select: { topic: true, word: true },
  });

  const existingKeys = new Set(
    existing.map((w) => `${w.topic}\0${cleanHardWordAnswer(w.word).toLowerCase()}`)
  );

  const toCreate = parsed.words.filter((w) => {
    const prepared = prepareHardWordFields(w.word, w.definition, w.example);
    const key = `${w.topic}\0${prepared.word.toLowerCase()}`;
    return !existingKeys.has(key);
  });

  const skipped = parsed.words.length - toCreate.length;

  if (toCreate.length === 0) {
    return {
      error:
        skipped > 0
          ? "Все слова из файла уже есть в словаре"
          : "Не удалось добавить слова",
    };
  }

  await prisma.hardWord.createMany({
    data: toCreate.map((w) => {
      const prepared = prepareHardWordFields(w.word, w.definition, w.example);
      return {
        teacherId: session.id,
        topic: w.topic,
        ...prepared,
      };
    }),
  });

  revalidatePath("/hard-words");
  revalidatePath("/settings");

  return {
    success: true,
    count: toCreate.length,
    skipped,
    warnings: parsed.errors,
  };
}

export async function createHardWord(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const topic = parseTopic(String(formData.get("topic") ?? ""));
  const rawWord = String(formData.get("word") ?? "").trim();
  const rawDefinition = String(formData.get("definition") ?? "").trim();
  const rawExample = String(formData.get("example") ?? "").trim();
  const { word, definition, example } = prepareHardWordFields(
    rawWord,
    rawDefinition,
    rawExample
  );

  if (!topic) return { error: "Выберите тему" };
  if (!word) return { error: "Укажите слово" };
  if (!definition) return { error: "Добавьте значение или пояснение" };

  await prisma.hardWord.create({
    data: { teacherId: session.id, topic, word, definition, example },
  });

  revalidatePath("/hard-words");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateHardWord(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const id = String(formData.get("id") ?? "");
  const topic = parseTopic(String(formData.get("topic") ?? ""));
  const rawWord = String(formData.get("word") ?? "").trim();
  const rawDefinition = String(formData.get("definition") ?? "").trim();
  const rawExample = String(formData.get("example") ?? "").trim();
  const { word, definition, example } = prepareHardWordFields(
    rawWord,
    rawDefinition,
    rawExample
  );

  if (!topic) return { error: "Выберите тему" };
  if (!word) return { error: "Укажите слово" };
  if (!definition) return { error: "Добавьте значение или пояснение" };

  const existing = await prisma.hardWord.findFirst({
    where: { id, teacherId: session.id },
  });
  if (!existing) return { error: "Слово не найдено" };

  await prisma.hardWord.update({
    where: { id },
    data: { topic, word, definition, example },
  });

  revalidatePath("/hard-words");
  return { success: true };
}

export async function deleteHardWord(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.hardWord.findFirst({
    where: { id, teacherId: session.id },
  });
  if (!existing) return { error: "Слово не найдено" };

  await prisma.hardWord.delete({ where: { id } });

  revalidatePath("/hard-words");
  return { success: true };
}

export async function markHardWordLearned(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "student") return { error: "Unauthorized" };

  const hardWordId = String(formData.get("hardWordId") ?? "");

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: { group: true },
  });
  if (!student) return { error: "Ученик не найден" };

  const word = await prisma.hardWord.findFirst({
    where: { id: hardWordId, teacherId: student.group.teacherId },
  });
  if (!word) return { error: "Слово не найдено" };

  await prisma.hardWordProgress.upsert({
    where: {
      studentId_hardWordId: { studentId: session.id, hardWordId },
    },
    create: { studentId: session.id, hardWordId },
    update: { learnedAt: new Date() },
  });

  revalidatePath("/hard-words");
  revalidatePath("/results");
  return { success: true };
}

export async function unmarkHardWordLearned(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "student") return { error: "Unauthorized" };

  const hardWordId = String(formData.get("hardWordId") ?? "");

  await prisma.hardWordProgress.deleteMany({
    where: { studentId: session.id, hardWordId },
  });

  revalidatePath("/hard-words");
  revalidatePath("/results");
  return { success: true };
}
