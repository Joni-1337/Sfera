"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { applyDailyQuizResult } from "@/lib/daily-words";
import { matchesWord } from "@/lib/daily-words-shared";
import { cleanHardWordAnswer } from "@/lib/hard-words-utils";
import { prisma } from "@/lib/prisma";
import { markHardWordLearned } from "@/lib/hard-word-actions";

export async function submitDailyWordQuiz(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { error: "Необходима авторизация ученика" };
  }

  const sessionDate = String(formData.get("sessionDate") ?? "");
  const wordIds = formData.getAll("wordIds").map(String).filter(Boolean);

  if (!sessionDate || wordIds.length === 0) {
    return { error: "Некорректные данные сессии" };
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: { group: true },
  });
  if (!student) return { error: "Ученик не найден" };

  const words = await prisma.hardWord.findMany({
    where: {
      id: { in: wordIds },
      teacherId: student.group.teacherId,
    },
  });

  if (words.length !== wordIds.length) {
    return { error: "Слова не найдены" };
  }

  let score = 0;
  const results = words.map((word) => {
    const answer = String(formData.get(`answer_${word.id}`) ?? "");
    const correct = matchesWord(answer, word.word);
    if (correct) score++;
    return {
      wordId: word.id,
      word: cleanHardWordAnswer(word.word),
      userAnswer: answer.trim(),
      correct,
    };
  });

  const outcome = await applyDailyQuizResult(
    session.id,
    sessionDate,
    score,
    words.length
  );

  if ("error" in outcome && outcome.error) {
    return { error: outcome.error };
  }

  if (outcome.passed) {
    for (const result of results.filter((item) => item.correct)) {
      const fd = new FormData();
      fd.set("hardWordId", result.wordId);
      await markHardWordLearned(fd);
    }
  }

  revalidatePath("/hard-words");
  revalidatePath("/results");

  return { ...outcome, wordResults: results };
}
