"use server";

import { revalidatePath } from "next/cache";
import { getSession, requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEgeTestTemplate, detectEgeVariantNumber } from "@/lib/test-templates";
import { parseQuestionsFromExcel } from "@/lib/excel-import";
import { checkAnswer, normalizeCorrectAnswer } from "@/lib/scoring";
import type { QuestionInput } from "@/lib/assignment-actions";
import {
  normalizeChoiceLetter,
  optionsToFields,
  parseOptionsList,
} from "@/lib/question-options";
import { assertHasFullAccess } from "@/lib/subscription";
import { normalizeEgePrompt } from "@/lib/ege-prompt";

const RESULT_CATEGORY = "ege-tests";

async function verifyGroupAccess(groupId: string, teacherId: string) {
  return prisma.group.findFirst({ where: { id: groupId, teacherId } });
}

async function verifyTestAccess(testId: string, teacherId: string) {
  return prisma.test.findFirst({
    where: { id: testId, group: { teacherId } },
    include: { group: { include: { students: true } } },
  });
}

async function notifyGroupAboutTest(testId: string, groupId: string, title: string) {
  const students = await prisma.student.findMany({ where: { groupId } });
  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({
      studentId: s.id,
      testId,
      type: "new_test",
      title: "Новый тест",
      message: `Вам назначен тест: «${title}»`,
    })),
  });
}

function mapQuestionToCreate(q: QuestionInput, i: number) {
  const type = q.type ?? "multiple_choice";
  const options = q.answerOptions?.trim()
    ? parseOptionsList(q.answerOptions)
    : [q.optionA, q.optionB, q.optionC, q.optionD]
        .map((part) => (part ?? "").trim())
        .filter(Boolean);
  const spread = optionsToFields(options);

  return {
    orderIndex: i,
    type,
    prompt: normalizeEgePrompt(q.prompt),
    ...spread,
    correctOption: normalizeCorrectAnswer(type, q.correctOption),
    explanation: q.explanation ?? "",
  };
}

function parseQuestionsFromForm(formData: FormData): QuestionInput[] {
  const questions: QuestionInput[] = [];
  let i = 0;
  while (formData.has(`questions[${i}].prompt`)) {
    const prompt = String(formData.get(`questions[${i}].prompt`) ?? "").trim();
    if (prompt) {
      questions.push({
        type: String(formData.get(`questions[${i}].type`) ?? "multiple_choice"),
        prompt,
        optionA: String(formData.get(`questions[${i}].optionA`) ?? ""),
        optionB: String(formData.get(`questions[${i}].optionB`) ?? ""),
        optionC: String(formData.get(`questions[${i}].optionC`) ?? ""),
        optionD: String(formData.get(`questions[${i}].optionD`) ?? ""),
        correctOption: String(formData.get(`questions[${i}].correctOption`) ?? "A"),
        explanation: String(formData.get(`questions[${i}].explanation`) ?? ""),
      });
    }
    i++;
  }
  return questions;
}

function parseGroupIds(formData: FormData): string[] {
  const fromList = formData.getAll("groupIds").map(String).filter(Boolean);
  if (fromList.length > 0) return fromList;

  const single = String(formData.get("groupId") ?? "").trim();
  return single ? [single] : [];
}

async function resolveQuestions(
  formData: FormData
): Promise<{ questions: QuestionInput[]; egeVariantNumber: number | null } | { error: string }> {
  const useTemplate = formData.get("useTemplate") === "on";
  const excelFile = formData.get("excelFile") as File | null;

  if (excelFile && excelFile.size > 0) {
    const buffer = await excelFile.arrayBuffer();
    const parsed = parseQuestionsFromExcel(buffer);
    if (parsed.errors.length && parsed.questions.length === 0) {
      return { error: parsed.errors.join("; ") };
    }
    return {
      questions: parsed.questions,
      egeVariantNumber: detectEgeVariantNumber(parsed.questions),
    };
  }

  if (useTemplate) {
    const template = getEgeTestTemplate();
    return {
      questions: template.questions,
      egeVariantNumber: template.variantNumber,
    };
  }

  const questions = parseQuestionsFromForm(formData);
  return { questions, egeVariantNumber: null };
}

export async function createTest(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const groupIds = parseGroupIds(formData);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const allowRetake = formData.get("allowRetake") === "on";
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  if (!title) {
    return { error: "Заполните название" };
  }

  if (groupIds.length === 0) {
    return { error: "Выберите хотя бы одну группу" };
  }

  const uniqueGroupIds = [...new Set(groupIds)];
  for (const groupId of uniqueGroupIds) {
    const group = await verifyGroupAccess(groupId, session.id);
    if (!group) return { error: "Одна из выбранных групп не найдена" };
  }

  const resolved = await resolveQuestions(formData);
  if ("error" in resolved) return { error: resolved.error };
  const { questions, egeVariantNumber } = resolved;

  if (questions.length === 0) {
    return { error: "Добавьте хотя бы один вопрос" };
  }

  const testIds: string[] = [];

  for (const groupId of uniqueGroupIds) {
    const test = await prisma.test.create({
      data: {
        title,
        description,
        groupId,
        allowRetake,
        shuffleQuestions,
        egeVariantNumber,
        dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
        questions: { create: questions.map(mapQuestionToCreate) },
      },
    });
    testIds.push(test.id);
  }

  revalidatePath("/tests");
  return {
    success: true,
    testId: testIds[0],
    testIds,
    createdCount: testIds.length,
  };
}

export async function updateTest(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const testId = String(formData.get("testId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const allowRetake = formData.get("allowRetake") === "on";
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  if (!testId || !title) {
    return { error: "Заполните название" };
  }

  const test = await verifyTestAccess(testId, session.id);
  if (!test) return { error: "Тест не найден" };
  if (test.published) {
    return { error: "Нельзя редактировать опубликованный тест. Снимите с публикации." };
  }

  const attemptCount = await prisma.testAttempt.count({ where: { testId } });
  if (attemptCount > 0) {
    return { error: "Нельзя редактировать тест, по которому уже есть попытки" };
  }

  const questions = parseQuestionsFromForm(formData);
  if (questions.length === 0) {
    return { error: "Добавьте хотя бы один вопрос" };
  }

  await prisma.$transaction([
    prisma.testQuestion.deleteMany({ where: { testId } }),
    prisma.test.update({
      where: { id: testId },
      data: {
        title,
        description,
        allowRetake,
        shuffleQuestions,
        egeVariantNumber: detectEgeVariantNumber(questions),
        dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
        questions: { create: questions.map(mapQuestionToCreate) },
      },
    }),
  ]);

  revalidatePath("/tests");
  revalidatePath(`/tests/${testId}`);
  revalidatePath(`/tests/${testId}/edit`);
  return { success: true, testId };
}

export async function updateTestSettings(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const testId = String(formData.get("testId") ?? "");
  const allowRetake = formData.get("allowRetake") === "on";

  const test = await verifyTestAccess(testId, session.id);
  if (!test) return { error: "Тест не найден" };

  await prisma.test.update({
    where: { id: testId },
    data: { allowRetake },
  });

  revalidatePath(`/tests/${testId}`);
  return { success: true };
}

export async function publishTest(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const testId = String(formData.get("testId") ?? "");
  const test = await verifyTestAccess(testId, session.id);
  if (!test) return { error: "Тест не найден" };

  const wasPublished = test.published;

  await prisma.test.update({
    where: { id: testId },
    data: { published: true },
  });

  if (!wasPublished) {
    await notifyGroupAboutTest(testId, test.groupId, test.title);
  }

  revalidatePath("/tests");
  revalidatePath(`/tests/${testId}`);
  return { success: true };
}

export async function unpublishTest(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const testId = String(formData.get("testId") ?? "");
  const test = await verifyTestAccess(testId, session.id);
  if (!test) return { error: "Тест не найден" };

  await prisma.test.update({
    where: { id: testId },
    data: { published: false },
  });

  revalidatePath("/tests");
  revalidatePath(`/tests/${testId}`);
  return { success: true };
}

export async function deleteTest(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const testId = String(formData.get("testId") ?? "");
  const test = await verifyTestAccess(testId, session.id);
  if (!test) return { error: "Тест не найден" };

  await prisma.test.delete({ where: { id: testId } });

  revalidatePath("/tests");
  return { success: true };
}

export async function duplicateTest(testId: string) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const source = await prisma.test.findFirst({
    where: { id: testId, group: { teacherId: session.id } },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!source) return { error: "Тест не найден" };

  const copy = await prisma.test.create({
    data: {
      title: `${source.title} (копия)`,
      description: source.description,
      groupId: source.groupId,
      published: false,
      allowRetake: source.allowRetake,
      shuffleQuestions: source.shuffleQuestions,
      egeVariantNumber: source.egeVariantNumber,
      dueAt: source.dueAt,
      questions: {
        create: source.questions.map((q) => ({
          orderIndex: q.orderIndex,
          type: q.type,
          prompt: q.prompt,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          answerOptions: q.answerOptions,
          correctOption: q.correctOption,
          explanation: q.explanation,
        })),
      },
    },
  });

  revalidatePath("/tests");
  revalidatePath(`/tests/${copy.id}`);
  return { success: true, testId: copy.id };
}

export async function startTestAttempt(testId: string, studentId: string) {
  const test = await prisma.test.findFirst({
    where: { id: testId, published: true },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!test) return { error: "Тест не найден или не опубликован" };

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId: test.groupId },
  });
  if (!student) return { error: "Нет доступа к тесту" };

  const bestCompleted = await prisma.testAttempt.findFirst({
    where: { testId, studentId, status: "completed" },
    orderBy: [{ score: "desc" }, { attemptNumber: "desc" }],
  });

  if (
    bestCompleted &&
    bestCompleted.score === bestCompleted.maxScore &&
    bestCompleted.maxScore > 0
  ) {
    await prisma.testAttempt.deleteMany({
      where: { testId, studentId, status: "in_progress" },
    });
    return {
      error: "Тест выполнен на максимум",
      attemptId: bestCompleted.id,
      perfect: true,
    };
  }

  const inProgress = await prisma.testAttempt.findFirst({
    where: { testId, studentId, status: "in_progress" },
    orderBy: { startedAt: "desc" },
  });
  if (inProgress) {
    return { success: true, attemptId: inProgress.id };
  }

  if (bestCompleted && !test.allowRetake) {
    return { error: "Вы уже выполнили этот тест", attemptId: bestCompleted.id };
  }

  const attemptCount = await prisma.testAttempt.count({
    where: { testId, studentId },
  });

  const attempt = await prisma.testAttempt.create({
    data: {
      testId,
      studentId,
      attemptNumber: attemptCount + 1,
      maxScore: test.questions.length,
    },
  });

  return { success: true, attemptId: attempt.id, attemptNumber: attempt.attemptNumber };
}

export async function saveTestAttemptDraft(
  attemptId: string,
  answers: Record<string, string>
) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { error: "Нет доступа" };
  }

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId: session.id, status: "in_progress" },
  });
  if (!attempt) return { error: "Попытка не найдена" };

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { draftAnswers: JSON.stringify(answers) },
  });

  return { success: true };
}

export async function submitTestAttempt(formData: FormData) {
  const testId = String(formData.get("testId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");

  const test = await prisma.test.findFirst({
    where: { id: testId, published: true },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      group: { select: { teacherId: true } },
    },
  });
  if (!test) return { error: "Тест не найден" };

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId: test.groupId },
    select: { id: true, fullName: true },
  });
  if (!student) return { error: "Нет доступа" };

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId, testId, status: "in_progress" },
  });
  if (!attempt) return { error: "Попытка не найдена или уже завершена" };

  if (test.dueAt && new Date() > new Date(test.dueAt) && !test.allowRetake) {
    return { error: "Срок сдачи истёк. Пересдача не разрешена." };
  }

  let score = 0;
  const answerRecords = test.questions.map((q) => {
    const raw = String(formData.get(`answer_${q.id}`) ?? "");
    const chosen =
      q.type === "multiple_choice"
        ? normalizeChoiceLetter(raw) ?? raw.trim().toUpperCase()
        : raw.trim();
    const isCorrect = checkAnswer(q.type, chosen, q.correctOption);
    if (isCorrect) score++;
    return {
      attemptId: attempt.id,
      questionId: q.id,
      chosenOption: chosen,
      isCorrect,
    };
  });

  const isPerfect = score === test.questions.length && test.questions.length > 0;

  await prisma.$transaction([
    prisma.testQuestionAnswer.deleteMany({ where: { attemptId: attempt.id } }),
    prisma.testQuestionAnswer.createMany({ data: answerRecords }),
    prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "completed",
        score,
        maxScore: test.questions.length,
        completedAt: new Date(),
      },
    }),
    ...(isPerfect
      ? [
          prisma.testAttempt.deleteMany({
            where: {
              testId,
              studentId,
              status: "in_progress",
              id: { not: attempt.id },
            },
          }),
        ]
      : []),
    prisma.result.upsert({
      where: { testAttemptId: attempt.id },
      create: {
        studentId,
        category: RESULT_CATEGORY,
        taskName: `${test.title} (попытка ${attempt.attemptNumber})`,
        score,
        maxScore: test.questions.length,
        testAttemptId: attempt.id,
      },
      update: {
        score,
        maxScore: test.questions.length,
        completedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/tests");
  revalidatePath("/results");
  revalidatePath(`/tests/${testId}`);

  return { success: true, score, maxScore: test.questions.length, attemptId: attempt.id };
}
