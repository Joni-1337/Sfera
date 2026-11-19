import "server-only";

import { prisma } from "@/lib/prisma";

// Чтение уведомлений и «Паузы» для серверных компонентов.
// Эти функции намеренно НЕ лежат в файлах с "use server": иначе Next.js
// публикует их как server actions, и любой мог бы прочитать чужие данные,
// подставив id ученика или преподавателя.

export async function getUnreadNotificationCount(studentId: string) {
  return prisma.notification.count({
    where: { studentId, read: false },
  });
}

export async function getRecentNotifications(studentId: string) {
  return prisma.notification.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      message: true,
      read: true,
      assignmentId: true,
      testId: true,
      createdAt: true,
    },
  });
}

export async function getTeacherNotifications(teacherId: string, limit = 50) {
  return prisma.teacherNotification.findMany({
    where: { teacherId, type: { not: "student_submission" } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadTeacherNotificationCount(teacherId: string) {
  return prisma.teacherNotification.count({
    where: { teacherId, read: false, type: { not: "student_submission" } },
  });
}

export async function getPauseItems(studentId: string) {
  return prisma.pauseItem.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
}
