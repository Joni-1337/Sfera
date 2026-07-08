"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trialEndDate, assertCanCreateGroup } from "@/lib/subscription";
import {
  sendTeacherVerificationEmail,
  sendTeacherVerificationEmailByAddress,
} from "@/lib/email-verification";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterFormState = { error?: string; redirectTo?: string } | null;
export type ResendEmailState = {
  error?: string;
  message?: string;
  devLink?: string | null;
} | null;

export async function registerTeacherFormAction(
  _prev: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  try {
    return await registerTeacherCore(formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[registerTeacherFormAction]", error);
    return { error: "Ошибка сервера. Попробуйте позже." };
  }
}

export async function resendVerificationFormAction(
  _prev: ResendEmailState,
  formData: FormData
): Promise<ResendEmailState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Введите корректный email" };
  }

  const result = await sendTeacherVerificationEmailByAddress(email);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  if ("devLink" in result && result.devLink) {
    return {
      message: "Ссылка для подтверждения обновлена.",
      devLink: result.devLink,
    };
  }

  return { message: "Письмо отправлено. Проверьте почту и папку «Спам»." };
}

async function registerTeacherCore(formData: FormData): Promise<RegisterFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const agreed = formData.get("agreed") === "on";

  if (!fullName || fullName.length < 3) {
    return { error: "Введите ФИО (минимум 3 символа)" };
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Введите корректный email" };
  }

  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов" };
  }

  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  if (!agreed) {
    return { error: "Необходимо согласие с политикой обработки данных" };
  }

  const existing = await prisma.teacher.findUnique({ where: { email } });
  if (existing) {
    return { error: "Преподаватель с таким email уже зарегистрирован" };
  }

  const teacher = await prisma.teacher.create({
    data: {
      email,
      fullName,
      passwordHash: await bcrypt.hash(password, 10),
      emailVerified: false,
      subscriptionStatus: "trial",
      trialEndsAt: trialEndDate(),
    },
  });

  const sent = await sendTeacherVerificationEmail(teacher.id);
  if ("error" in sent && sent.error) {
    await prisma.teacher.delete({ where: { id: teacher.id } });
    return { error: sent.error };
  }

  const params = new URLSearchParams({ email });
  if ("localMode" in sent && sent.localMode) params.set("local", "1");
  if ("warning" in sent && sent.warning) params.set("warn", sent.warning);

  return { redirectTo: `/register/check-email?${params.toString()}` };
}

export type LoginFormState = {
  error?: string;
  redirectTo?: string;
  needsVerification?: boolean;
  email?: string;
} | null;

export async function loginTeacherFormAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    return await loginTeacherCore(formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[loginTeacherFormAction]", error);
    return { error: "Ошибка сервера. Попробуйте позже." };
  }
}

export async function loginStudentFormAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    return await loginStudentCore(formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[loginStudentFormAction]", error);
    return { error: "Ошибка сервера. Попробуйте позже." };
  }
}

async function loginTeacherCore(formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher || !(await bcrypt.compare(password, teacher.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }

  if (!teacher.emailVerified) {
    return {
      error: "Подтвердите email — мы отправили письмо при регистрации",
      needsVerification: true,
      email: teacher.email,
    };
  }

  await createSession({
    role: "teacher",
    id: teacher.id,
    name: teacher.fullName,
    email: teacher.email,
  });

  return { redirectTo: "/dashboard" };
}

async function loginStudentCore(formData: FormData): Promise<LoginFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const accessKey = String(formData.get("accessKey") ?? "").trim().toUpperCase();
  const agreed = formData.get("agreed") === "on";

  if (!fullName || !accessKey) {
    return { error: "Введите имя и ключ доступа" };
  }

  if (!agreed) {
    return { error: "Необходимо согласие с политикой обработки данных" };
  }

  const student = await prisma.student.findUnique({
    where: { accessKey },
    include: { group: true },
  });

  if (!student) {
    return { error: "Неверный ключ доступа" };
  }

  const normalizedInput = fullName.toLowerCase();
  const normalizedStored = student.fullName.toLowerCase();
  if (normalizedInput !== normalizedStored) {
    return { error: "Имя не совпадает с учётной записью" };
  }

  await createSession({
    role: "student",
    id: student.id,
    name: student.fullName,
    groupId: student.groupId,
    groupName: student.group.name,
  });

  return { redirectTo: "/dashboard" };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function resendVerificationEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Введите корректный email" };
  }

  const result = await sendTeacherVerificationEmailByAddress(email);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  return {
    success: true,
    devLink: "devLink" in result ? result.devLink : null,
  };
}

export async function changeTeacherPassword(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "Новый пароль должен быть не короче 6 символов" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: session.id } });
  if (!teacher || !(await bcrypt.compare(currentPassword, teacher.passwordHash))) {
    return { error: "Неверный текущий пароль" };
  }

  await prisma.teacher.update({
    where: { id: session.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return { success: true };
}

export async function updateTeacherProfile(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName || fullName.length < 3) {
    return { error: "Введите ФИО (минимум 3 символа)" };
  }

  const teacher = await prisma.teacher.update({
    where: { id: session.id },
    data: { fullName },
  });

  await createSession({
    role: "teacher",
    id: teacher.id,
    name: teacher.fullName,
    email: teacher.email,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTeacherTheme(theme: string) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  if (theme !== "dark" && theme !== "light") {
    return { error: "Недопустимое значение темы" };
  }

  await prisma.teacher.update({
    where: { id: session.id },
    data: { uiTheme: theme },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function createGroup(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Укажите название группы" };

  const limit = await assertCanCreateGroup(session.id);
  if (limit.error) return { error: limit.error };

  await prisma.group.create({
    data: { teacherId: session.id, name },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGroup(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Укажите название группы" };

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
  });
  if (!group) return { error: "Группа не найдена" };

  await prisma.group.update({
    where: { id: groupId },
    data: { name },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/group/${groupId}/settings`);
  return { success: true };
}

export async function archiveGroup(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const groupId = String(formData.get("groupId") ?? "");

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
  });
  if (!group) return { error: "Группа не найдена" };

  await prisma.group.update({
    where: { id: groupId },
    data: { archived: true },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function unarchiveGroup(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const groupId = String(formData.get("groupId") ?? "");

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
  });
  if (!group) return { error: "Группа не найдена" };

  const limit = await assertCanCreateGroup(session.id);
  if (limit.error) return { error: limit.error };

  await prisma.group.update({
    where: { id: groupId },
    data: { archived: false },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/group/${groupId}/settings`);
  return { success: true };
}

export async function deleteGroup(formData: FormData) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация преподавателя" };

  const groupId = String(formData.get("groupId") ?? "");

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
  });
  if (!group) return { error: "Группа не найдена" };

  await prisma.group.delete({ where: { id: groupId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
