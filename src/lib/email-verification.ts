import "server-only";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  appBaseUrl,
  isEmailConfigured,
  isResendSandboxRecipientError,
  sendVerificationEmail,
  usesLocalEmailVerification,
} from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildVerificationUrl(token: string) {
  return `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(teacherId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.upsert({
    where: { teacherId },
    create: { teacherId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, createdAt: new Date() },
  });

  return token;
}

export async function sendTeacherVerificationEmail(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, email: true, fullName: true, emailVerified: true },
  });

  if (!teacher) return { error: "Аккаунт не найден" as const };
  if (teacher.emailVerified) return { error: "Email уже подтверждён" as const };

  const token = await createEmailVerificationToken(teacher.id);
  const verifyUrl = buildVerificationUrl(token);

  if (usesLocalEmailVerification()) {
    console.info("[email-verification] Local verify link:", verifyUrl);
    return {
      success: true as const,
      devLink: verifyUrl,
      localMode: true,
    };
  }

  if (isEmailConfigured()) {
    const sent = await sendVerificationEmail(teacher.email, verifyUrl, teacher.fullName);
    if (!sent.ok) {
      if (
        sent.status &&
        sent.rawBody &&
        isResendSandboxRecipientError(sent.status, sent.rawBody)
      ) {
        return {
          success: true as const,
          devLink: verifyUrl,
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

  console.info("[email-verification] Dev link:", verifyUrl);
  return { success: true as const, devLink: verifyUrl };
}

export async function sendTeacherVerificationEmailByAddress(email: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });

  if (!teacher) {
    return { success: true as const, devLink: null };
  }

  return sendTeacherVerificationEmail(teacher.id);
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token.trim());

  const record = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash },
    include: { teacher: true },
  });

  if (!record) {
    return { error: "Ссылка недействительна или уже использована" as const };
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { error: "Ссылка истекла. Запросите новое письмо." as const };
  }

  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: record.teacherId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  return {
    success: true as const,
    teacher: {
      id: record.teacher.id,
      fullName: record.teacher.fullName,
      email: record.teacher.email,
    },
  };
}

export async function getDevVerificationLinkForEmail(email: string) {
  if (!usesLocalEmailVerification()) {
    return null;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, emailVerified: true },
  });

  if (!teacher || teacher.emailVerified) return null;

  const token = await createEmailVerificationToken(teacher.id);
  return buildVerificationUrl(token);
}
