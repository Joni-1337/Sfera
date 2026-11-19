"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session || session.role !== "student") return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id: notificationId, studentId: session.id },
    data: { read: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session || session.role !== "student") return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { studentId: session.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}
