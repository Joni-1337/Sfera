"use server";

import { revalidatePath } from "next/cache";
import { getSession, requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTemplatesForCategory } from "@/lib/question-templates";
import { parseQuestionsFromExcel } from "@/lib/excel-import";
import { checkAnswer, normalizeCorrectAnswer } from "@/lib/scoring";
import { normalizeChoiceLetter, optionsToFields, parseOptionsList } from "@/lib/question-options";
import { assertHasFullAccess } from "@/lib/subscription";

export type QuestionInput = {
  type?: string;
  prompt: string;
  answerOptions?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
};

async function verifyGroupAccess(groupId: string, teacherId: string) {
  return prisma.group.findFirst({ where: { id: groupId, teacherId } });
}

async function verifyAssignmentAccess(assignmentId: string, teacherId: string) {
  return prisma.assignment.findFirst({
    where: { id: assignmentId, group: { teacherId } },
    include: { group: { include: { students: true } } },
  });
}

async function notifyGroupAboutAssignment(
  assignmentId: string,
  groupId: string,
  title: string
) {
  const students = await prisma.student.findMany({ where: { groupId } });
  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({
      studentId: s.id,
      assignmentId,
      type: "new_assignment",
      title: "Новое задание",
      message: `Вам назначено задание: «${title}»`,
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
    prompt: q.prompt,
    ...spread,
    correctOption: normalizeCorrectAnswer(type, q.correctOption),
    explanation: q.explanation ?? "",
  };
}

export async function createAssignment(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const groupId = String(formData.get("groupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const useTemplate = formData.get("useTemplate") === "on";
  const allowRetake = formData.get("allowRetake") === "on";
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  if (!groupId || !title || !category) {
    return { error: "Заполните название и категорию" };
  }

  const group = await verifyGroupAccess(groupId, session.id);
  if (!group) return { error: "Группа не найдена" };

  let questions: QuestionInput[] = [];

  const excelFile = formData.get("excelFile") as File | null;
  if (excelFile && excelFile.size > 0) {
    const buffer = await excelFile.arrayBuffer();
    const parsed = parseQuestionsFromExcel(buffer);
    if (parsed.errors.length && parsed.questions.length === 0) {
      return { error: parsed.errors.join("; ") };
    }
    questions = parsed.questions;
  } else if (useTemplate) {
    questions = getTemplatesForCategory(category);
  } else {
    questions = parseQuestionsFromForm(formData);
  }

  if (questions.length === 0) {
    return { error: "Добавьте хотя бы один вопрос" };
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      category,
      description,
      groupId,
      allowRetake,
      shuffleQuestions,
      dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
      questions: { create: questions.map(mapQuestionToCreate) },
    },
  });

  revalidatePath(`/dashboard/group/${groupId}/assignments`);
  return { success: true, assignmentId: assignment.id };
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

export async function updateAssignment(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const allowRetake = formData.get("allowRetake") === "on";
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  if (!assignmentId || !title || !category) {
    return { error: "Заполните название и категорию" };
  }

  const assignment = await verifyAssignmentAccess(assignmentId, session.id);
  if (!assignment) return { error: "Задание не найдено" };
  if (assignment.published) {
    return { error: "Нельзя редактировать опубликованное задание. Снимите с публикации." };
  }

  const attemptCount = await prisma.attempt.count({ where: { assignmentId } });
  if (attemptCount > 0) {
    return { error: "Нельзя редактировать задание, по которому уже есть попытки" };
  }

  const questions = parseQuestionsFromForm(formData);
  if (questions.length === 0) {
    return { error: "Добавьте хотя бы один вопрос" };
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { assignmentId } }),
    prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title,
        category,
        description,
        allowRetake,
        shuffleQuestions,
        dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
        questions: { create: questions.map(mapQuestionToCreate) },
      },
    }),
  ]);

  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments`);
  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}`);
  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}/edit`);
  return { success: true, assignmentId };
}

export async function updateAssignmentSettings(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const allowRetake = formData.get("allowRetake") === "on";

  const assignment = await verifyAssignmentAccess(assignmentId, session.id);
  if (!assignment) return { error: "Задание не найдено" };

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { allowRetake },
  });

  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}`);
  return { success: true };
}

export async function publishAssignment(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const assignment = await verifyAssignmentAccess(assignmentId, session.id);
  if (!assignment) return { error: "Задание не найдено" };

  const wasPublished = assignment.published;

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { published: true },
  });

  if (!wasPublished) {
    await notifyGroupAboutAssignment(assignmentId, assignment.groupId, assignment.title);
  }

  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments`);
  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function unpublishAssignment(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const assignment = await verifyAssignmentAccess(assignmentId, session.id);
  if (!assignment) return { error: "Задание не найдено" };

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { published: false },
  });

  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments`);
  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteAssignment(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const assignment = await verifyAssignmentAccess(assignmentId, session.id);
  if (!assignment) return { error: "Задание не найдено" };

  await prisma.assignment.delete({ where: { id: assignmentId } });

  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments`);
  return { success: true };
}

export async function duplicateAssignment(assignmentId: string) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const access = await assertHasFullAccess(session.id);
  if (access.error) return { error: access.error };

  const source = await prisma.assignment.findFirst({
    where: { id: assignmentId, group: { teacherId: session.id } },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!source) return { error: "Задание не найдено" };

  const copy = await prisma.assignment.create({
    data: {
      title: `${source.title} (копия)`,
      category: source.category,
      description: source.description,
      groupId: source.groupId,
      published: false,
      allowRetake: source.allowRetake,
      shuffleQuestions: source.shuffleQuestions,
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

  revalidatePath(`/dashboard/group/${source.groupId}/assignments`);
  revalidatePath("/tasks");
  return { success: true, assignmentId: copy.id, groupId: source.groupId };
}

export async function startAttempt(assignmentId: string, studentId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, published: true },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!assignment) return { error: "Задание не найдено или не опубликовано" };

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId: assignment.groupId },
  });
  if (!student) return { error: "Нет доступа к заданию" };

  const bestCompleted = await prisma.attempt.findFirst({
    where: { assignmentId, studentId, status: "completed" },
    orderBy: [{ score: "desc" }, { attemptNumber: "desc" }],
  });

  if (
    bestCompleted &&
    bestCompleted.score === bestCompleted.maxScore &&
    bestCompleted.maxScore > 0
  ) {
    await prisma.attempt.deleteMany({
      where: { assignmentId, studentId, status: "in_progress" },
    });
    return {
      error: "Задание выполнено на максимум",
      attemptId: bestCompleted.id,
      perfect: true,
    };
  }

  const inProgress = await prisma.attempt.findFirst({
    where: { assignmentId, studentId, status: "in_progress" },
    orderBy: { startedAt: "desc" },
  });
  if (inProgress) {
    return { success: true, attemptId: inProgress.id };
  }

  if (bestCompleted && !assignment.allowRetake) {
    return { error: "Вы уже выполнили это задание", attemptId: bestCompleted.id };
  }

  const attemptCount = await prisma.attempt.count({
    where: { assignmentId, studentId },
  });

  const attempt = await prisma.attempt.create({
    data: {
      assignmentId,
      studentId,
      attemptNumber: attemptCount + 1,
      maxScore: assignment.questions.length,
    },
  });

  return { success: true, attemptId: attempt.id, attemptNumber: attempt.attemptNumber };
}

export async function saveAttemptDraft(
  attemptId: string,
  answers: Record<string, string>
) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { error: "Нет доступа" };
  }

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, studentId: session.id, status: "in_progress" },
  });
  if (!attempt) return { error: "Попытка не найдена" };

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { draftAnswers: JSON.stringify(answers) },
  });

  return { success: true };
}

export async function submitAttempt(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, published: true },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      group: { select: { teacherId: true } },
    },
  });
  if (!assignment) return { error: "Задание не найдено" };

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId: assignment.groupId },
    select: { id: true, fullName: true },
  });
  if (!student) return { error: "Нет доступа" };

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, studentId, assignmentId, status: "in_progress" },
  });
  if (!attempt) return { error: "Попытка не найдена или уже завершена" };

  if (
    assignment.dueAt &&
    new Date() > new Date(assignment.dueAt) &&
    !assignment.allowRetake
  ) {
    return { error: "Срок сдачи истёк. Пересдача не разрешена." };
  }

  let score = 0;
  const answerRecords = assignment.questions.map((q) => {
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

  const isPerfect = score === assignment.questions.length && assignment.questions.length > 0;

  await prisma.$transaction([
    prisma.questionAnswer.deleteMany({ where: { attemptId: attempt.id } }),
    prisma.questionAnswer.createMany({ data: answerRecords }),
    prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        status: "completed",
        score,
        maxScore: assignment.questions.length,
        completedAt: new Date(),
      },
    }),
    ...(isPerfect
      ? [
          prisma.attempt.deleteMany({
            where: {
              assignmentId,
              studentId,
              status: "in_progress",
              id: { not: attempt.id },
            },
          }),
        ]
      : []),
    prisma.result.upsert({
      where: { attemptId: attempt.id },
      create: {
        studentId,
        category: assignment.category,
        taskName: `${assignment.title} (попытка ${attempt.attemptNumber})`,
        score,
        maxScore: assignment.questions.length,
        attemptId: attempt.id,
      },
      update: {
        score,
        maxScore: assignment.questions.length,
        completedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/results");
  revalidatePath(`/dashboard/group/${assignment.groupId}/assignments/${assignmentId}`);

  return { success: true, score, maxScore: assignment.questions.length, attemptId: attempt.id };
}
