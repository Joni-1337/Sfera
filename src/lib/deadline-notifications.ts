import "server-only";

import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export async function syncDeadlineNotifications(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true },
  });
  if (!student) return;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [assignments, tests] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        published: true,
        groupId: student.groupId,
        dueAt: { gt: now, lte: in24h },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        attempts: {
          where: { studentId, status: "completed" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.test.findMany({
      where: {
        published: true,
        groupId: student.groupId,
        dueAt: { gt: now, lte: in24h },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        attempts: {
          where: { studentId, status: "completed" },
          select: { id: true },
          take: 1,
        },
      },
    }),
  ]);

  for (const assignment of assignments) {
    if (assignment.attempts.length > 0 || !assignment.dueAt) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        studentId,
        assignmentId: assignment.id,
        type: "deadline_soon",
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        studentId,
        assignmentId: assignment.id,
        type: "deadline_soon",
        title: "Скоро дедлайн",
        message: `Задание «${assignment.title}» нужно сдать до ${formatDateTime(assignment.dueAt)}`,
      },
    });
  }

  for (const test of tests) {
    if (test.attempts.length > 0 || !test.dueAt) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        studentId,
        testId: test.id,
        type: "deadline_soon",
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        studentId,
        testId: test.id,
        type: "deadline_soon",
        title: "Скоро дедлайн",
        message: `Тест «${test.title}» нужно пройти до ${formatDateTime(test.dueAt)}`,
      },
    });
  }
}
