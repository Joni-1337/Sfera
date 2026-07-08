"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCanAddStudent } from "@/lib/subscription";

const ACCESS_KEY_RE = /^[A-Z0-9]{4,16}$/;

export async function createStudent(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  const customKey = String(formData.get("accessKey") ?? "").trim().toUpperCase();

  if (!fullName || !groupId) return { error: "Заполните все поля" };

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
  });
  if (!group) return { error: "Группа не найдена" };

  const limit = await assertCanAddStudent(session.id);
  if (limit.error) return { error: limit.error };

  const accessKey = customKey || generateAccessKey();

  if (customKey && !ACCESS_KEY_RE.test(customKey)) {
    return {
      error: "Ключ: 4–16 символов, только латинские буквы и цифры (A–Z, 0–9)",
    };
  }

  const existing = await prisma.student.findUnique({ where: { accessKey } });
  if (existing) {
    return { error: "Такой ключ уже занят, выберите другой" };
  }

  await prisma.student.create({
    data: { fullName, groupId, accessKey },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/group/${groupId}/students`);
  return { success: true, accessKey, fullName };
}

export async function deleteStudent(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const studentId = String(formData.get("studentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId },
    include: { group: true },
  });

  if (!student || student.group.teacherId !== session.id) {
    return { error: "Ученик не найден" };
  }

  await prisma.student.delete({ where: { id: studentId } });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/group/${groupId}/students`);
  return { success: true };
}

export async function resetStudentAccessKey(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const studentId = String(formData.get("studentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId },
    include: { group: true },
  });

  if (!student || student.group.teacherId !== session.id) {
    return { error: "Ученик не найден" };
  }

  let accessKey = generateAccessKey();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.student.findUnique({ where: { accessKey } });
    if (!existing) break;
    accessKey = generateAccessKey();
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { accessKey },
  });

  revalidatePath(`/dashboard/group/${groupId}/students`);
  return { success: true, accessKey, fullName: student.fullName };
}

function generateAccessKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
