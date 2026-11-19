"use server";



import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";



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

