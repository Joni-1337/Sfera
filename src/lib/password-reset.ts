import "server-only";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  appBaseUrl,
  isEmailConfigured,
  isResendSandboxRecipientError,
  sendPasswordResetEmail,
  usesLocalEmailVerification,
} from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetUrl(token: string) {
  return `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

async function createPasswordResetToken(teacherId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.upsert({
    where: { teacherId },
    create: { teacherId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, createdAt: new Date() },
  });

  return token;
}

export async function sendTeacherPasswordResetEmail(email: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, fullName: true, emailVerified: true },
  });

  if (!teacher) {
    return { success: true as const, devLink: null };
  }

  if (!teacher.emailVerified) {
    return {
      error:
        "Email ещё не подтверждён. Сначала подтвердите регистрацию или войдите через письмо с подтверждением." as const,
    };
  }

  const token = await createPasswordResetToken(teacher.id);
  const resetUrl = buildPasswordResetUrl(token);

  if (usesLocalEmailVerification()) {
    console.info("[password-reset] Local reset link:", resetUrl);
    return { success: true as const, devLink: resetUrl, localMode: true };
  }

  if (isEmailConfigured()) {
    const sent = await sendPasswordResetEmail(
      teacher.email,
      resetUrl,
      teacher.fullName
    );
    if (!sent.ok) {
      if (
        sent.status &&
        sent.rawBody &&
        isResendSandboxRecipientError(sent.status, sent.rawBody)
      ) {
        return {
          success: true as const,
          devLink: resetUrl,
          warning: sent.error,
        };
      }
      return { error: sent.error };
    }
    return { success: true as const, devLink: null };
  }

  if (process.env.NODE_ENV === "production") {
    return { error: "Почта не настроена. Добавьте RESEND_API_KEY в настройках сервера." as const };
  }

  console.info("[password-reset] Dev link:", resetUrl);
  return { success: true as const, devLink: resetUrl };
}

export async function validatePasswordResetToken(token: string) {
  const tokenHash = hashToken(token.trim());

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    include: { teacher: { select: { email: true } } },
  });

  if (!record) {
    return { error: "Ссылка недействительна или уже использована" as const };
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return { error: "Ссылка истекла. Запросите сброс пароля ещё раз." as const };
  }

  return { success: true as const, teacherId: record.teacherId, email: record.teacher.email };
}

export async function resetPasswordWithToken(
  token: string,
  password: string
) {
  const tokenHash = hashToken(token.trim());

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
  });

  if (!record) {
    return { error: "Ссылка недействительна или уже использована" as const };
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return { error: "Ссылка истекла. Запросите сброс пароля ещё раз." as const };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: record.teacherId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  const teacher = await prisma.teacher.findUnique({
    where: { id: record.teacherId },
    select: { email: true },
  });

  return {
    success: true as const,
    email: teacher?.email ?? "",
  };
}
