"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TEXT_TYPES } from "@/lib/text-constants";
import { normalizeTextContent } from "@/lib/text-format";

function parseTextForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const textType = String(formData.get("textType") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const content = normalizeTextContent(String(formData.get("content") ?? ""));
  const yearRaw = String(formData.get("year") ?? "").trim();
  const year = Number(yearRaw);

  if (!title || !author || !textType || !topic || !content.trim()) {
    return { error: "Заполните все обязательные поля" as const };
  }

  if (!TEXT_TYPES.includes(textType as (typeof TEXT_TYPES)[number])) {
    return { error: "Выберите тип текста из списка" as const };
  }

  if (!yearRaw || !Number.isInteger(year) || year < 1900 || year > 2100) {
    return { error: "Укажите корректный год" as const };
  }

  if (content.length < 50) {
    return { error: "Текст должен содержать минимум 50 символов" as const };
  }

  return {
    data: { title, author, textType, topic, content, year },
  };
}

async function verifyTextOwnership(textId: string, teacherId: string) {
  return prisma.text.findFirst({
    where: { id: textId, teacherId },
  });
}

export async function createText(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const parsed = parseTextForm(formData);
  if ("error" in parsed && parsed.error) return { error: parsed.error };

  const text = await prisma.text.create({
    data: {
      ...parsed.data!,
      teacherId: session.id,
    },
  });

  revalidatePath("/texts");
  revalidatePath(`/texts/${text.id}`);
  redirect(`/texts/${text.id}`);
}

export async function updateText(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const textId = String(formData.get("textId") ?? "");
  const text = await verifyTextOwnership(textId, session.id);
  if (!text) return { error: "Текст не найден или нет прав на редактирование" };

  const parsed = parseTextForm(formData);
  if ("error" in parsed && parsed.error) return { error: parsed.error };

  await prisma.text.update({
    where: { id: textId },
    data: parsed.data!,
  });

  revalidatePath("/texts");
  revalidatePath(`/texts/${textId}`);
  revalidatePath(`/texts/${textId}/edit`);
  return { success: true, textId };
}

export async function deleteText(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const textId = String(formData.get("textId") ?? "");
  const text = await verifyTextOwnership(textId, session.id);
  if (!text) return { error: "Текст не найден или нет прав на удаление" };

  await prisma.text.delete({ where: { id: textId } });

  revalidatePath("/texts");
  redirect("/texts");
}
