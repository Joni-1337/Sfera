"use server";



import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";



export type PauseItemType = "assignment" | "test" | "hard_word";



export type AddToPauseInput = {

  type: PauseItemType;

  assignmentId?: string;

  testId?: string;

  hardWordId?: string;

  title: string;

  note?: string;

};



export async function addToPause(studentId: string, data: AddToPauseInput) {

  const session = await getSession();

  if (!session || session.role !== "student" || session.id !== studentId) {

    return { error: "Нет доступа" };

  }



  const title = data.title.trim();

  if (!title) return { error: "Укажите название" };



  if (data.type === "assignment" && !data.assignmentId) {

    return { error: "Не указано задание" };

  }

  if (data.type === "test" && !data.testId) {

    return { error: "Не указан тест" };

  }

  if (data.type === "hard_word" && !data.hardWordId) {

    return { error: "Не указано слово" };

  }



  await prisma.pauseItem.create({

    data: {

      studentId,

      type: data.type,

      assignmentId: data.type === "assignment" ? data.assignmentId : null,

      testId: data.type === "test" ? data.testId : null,

      hardWordId: data.type === "hard_word" ? data.hardWordId : null,

      title,

      note: data.note?.trim() ?? "",

    },

  });



  revalidatePath("/pause");

  return { success: true };

}



export async function removeFromPause(pauseItemId: string, studentId: string) {

  const session = await getSession();

  if (!session || session.role !== "student" || session.id !== studentId) {

    return { error: "Нет доступа" };

  }



  await prisma.pauseItem.deleteMany({

    where: { id: pauseItemId, studentId },

  });



  revalidatePath("/pause");

  return { success: true };

}



export async function getPauseItems(studentId: string) {

  return prisma.pauseItem.findMany({

    where: { studentId },

    orderBy: { createdAt: "desc" },

  });

}


