"use server";



import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";



export type CreateTeacherNotificationData = {

  type: string;

  studentId?: string;

  assignmentId?: string;

  testId?: string;

  title: string;

  message: string;

  link?: string;

};



export async function createTeacherNotification(

  teacherId: string,

  data: CreateTeacherNotificationData

) {

  await prisma.teacherNotification.create({

    data: {

      teacherId,

      type: data.type,

      studentId: data.studentId ?? null,

      assignmentId: data.assignmentId ?? null,

      testId: data.testId ?? null,

      title: data.title,

      message: data.message,

      link: data.link ?? "",

    },

  });



  revalidatePath("/notifications");
  revalidatePath("/", "layout");

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



export async function markTeacherNotificationRead(

  notificationId: string,

  teacherId: string

) {

  const session = await getSession();

  if (!session || session.role !== "teacher" || session.id !== teacherId) {

    return { error: "Нет доступа" };

  }



  await prisma.teacherNotification.updateMany({

    where: { id: notificationId, teacherId },

    data: { read: true },

  });



  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  return { success: true };

}



export async function markAllTeacherNotificationsRead(teacherId: string) {

  const session = await getSession();

  if (!session || session.role !== "teacher" || session.id !== teacherId) {

    return { error: "Нет доступа" };

  }



  await prisma.teacherNotification.updateMany({

    where: { teacherId, read: false },

    data: { read: true },

  });



  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  return { success: true };

}

