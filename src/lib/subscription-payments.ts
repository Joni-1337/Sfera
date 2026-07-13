import "server-only";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, sendSubscriptionPaidEmail } from "@/lib/email";
import { getSubscriptionPriceRub } from "@/lib/subscription-shared";
import {
  createYookassaPayment,
  extractYookassaReceiptUrl,
  fetchYookassaPayment,
  isYookassaConfigured,
  yookassaAmountRub,
  yookassaPaymentDescription,
  type YookassaPaymentStatus,
} from "@/lib/yookassa";

const SUBSCRIPTION_PERIOD_DAYS = 30;

function computeSubscriptionEndDate(currentEndsAt: Date | null) {
  const now = new Date();
  const baseDate =
    currentEndsAt && currentEndsAt > now ? currentEndsAt : now;

  const endsAt = new Date(baseDate);
  endsAt.setDate(endsAt.getDate() + SUBSCRIPTION_PERIOD_DAYS);
  return endsAt;
}

function parsePaidAmountRub(amount?: { value: string; currency: string }) {
  if (!amount || amount.currency !== "RUB") return null;
  const parsed = Number.parseFloat(amount.value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

async function notifySubscriptionPaid(paymentId: string) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    include: {
      teacher: {
        select: { email: true, fullName: true, subscriptionEndsAt: true },
      },
    },
  });

  if (!payment || payment.status !== "succeeded" || payment.emailSentAt) {
    return;
  }

  if (!payment.teacher.email || !payment.teacher.subscriptionEndsAt) {
    return;
  }

  const emailResult = await sendSubscriptionPaidEmail({
    to: payment.teacher.email,
    fullName: payment.teacher.fullName,
    amountRub: payment.amountRub,
    subscriptionEndsAt: payment.teacher.subscriptionEndsAt,
    settingsUrl: `${appBaseUrl()}/settings#payments`,
  });

  if (emailResult.ok) {
    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { emailSentAt: new Date() },
    });
  } else {
    console.error("[subscription] paid email failed:", emailResult.error);
  }
}

export async function activateTeacherSubscription(
  teacherId: string,
  options?: { stub?: boolean }
) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { subscriptionEndsAt: true },
  });

  if (!teacher) {
    return { error: "Аккаунт не найден" as const };
  }

  const endsAt = computeSubscriptionEndDate(teacher.subscriptionEndsAt);
  const description = yookassaPaymentDescription();
  const amountRub = getSubscriptionPriceRub();

  let paymentId: string | null = null;

  if (options?.stub) {
    const payment = await prisma.subscriptionPayment.create({
      data: {
        teacherId,
        yookassaId: `stub_${randomUUID()}`,
        amountRub,
        status: "succeeded",
        description,
        paidAt: new Date(),
      },
    });
    paymentId = payment.id;
  }

  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  revalidatePath("/settings");

  if (paymentId) {
    await notifySubscriptionPaid(paymentId);
  }

  return { success: true as const, subscriptionEndsAt: endsAt, paymentId };
}

export async function createSubscriptionCheckout(teacherId: string) {
  if (!isYookassaConfigured()) {
    return { error: "ЮKassa не настроена" as const };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { email: true },
  });

  if (!teacher) {
    return { error: "Аккаунт не найден" as const };
  }

  const amountRub = yookassaAmountRub();
  const description = yookassaPaymentDescription();
  const returnUrl = `${appBaseUrl()}/pricing?payment=return`;

  const paymentRecord = await prisma.subscriptionPayment.create({
    data: {
      teacherId,
      yookassaId: `pending_${randomUUID()}`,
      amountRub,
      status: "pending",
      description,
    },
  });

  const created = await createYookassaPayment({
    amountRub,
    description,
    returnUrl,
    metadata: {
      teacherId,
      paymentId: paymentRecord.id,
    },
    customerEmail: teacher.email,
  });

  if (!created.ok) {
    await prisma.subscriptionPayment.delete({ where: { id: paymentRecord.id } });
    return { error: created.error };
  }

  const confirmationUrl = created.data.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    await prisma.subscriptionPayment.delete({ where: { id: paymentRecord.id } });
    return { error: "Платёжная система не вернула ссылку для оплаты." as const };
  }

  await prisma.subscriptionPayment.update({
    where: { id: paymentRecord.id },
    data: { yookassaId: created.data.id },
  });

  return { confirmationUrl };
}

export async function getLatestSubscriptionPayment(teacherId: string) {
  return prisma.subscriptionPayment.findFirst({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeacherSubscriptionPayments(teacherId: string, limit = 20) {
  return prisma.subscriptionPayment.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amountRub: true,
      status: true,
      description: true,
      receiptUrl: true,
      createdAt: true,
      paidAt: true,
    },
  });
}

/** После возврата с ЮKassa — проверяем статус платежа напрямую (не ждём webhook). */
export async function syncTeacherPaymentOnReturn(teacherId: string) {
  if (!isYookassaConfigured()) {
    return getLatestSubscriptionPayment(teacherId);
  }

  const latest = await getLatestSubscriptionPayment(teacherId);
  if (latest?.status === "pending" && !latest.yookassaId.startsWith("pending_")) {
    await processYookassaWebhookPayment(latest.yookassaId);
  }

  return getLatestSubscriptionPayment(teacherId);
}

function mapYookassaStatus(status: YookassaPaymentStatus) {
  if (status === "succeeded") return "succeeded" as const;
  if (status === "canceled") return "canceled" as const;
  return "pending" as const;
}

export async function processYookassaWebhookPayment(yookassaId: string) {
  const existing = await prisma.subscriptionPayment.findUnique({
    where: { yookassaId },
  });

  if (!existing) {
    console.warn("[yookassa] unknown payment:", yookassaId);
    return { ignored: true as const };
  }

  if (existing.status === "succeeded") {
    await notifySubscriptionPaid(existing.id);
    return { alreadyProcessed: true as const };
  }

  const remote = await fetchYookassaPayment(yookassaId);
  if (!remote.ok) {
    return { error: remote.error };
  }

  const mappedStatus = mapYookassaStatus(remote.data.status);

  if (mappedStatus === "pending") {
    return { pending: true as const };
  }

  if (mappedStatus === "canceled") {
    await prisma.subscriptionPayment.update({
      where: { id: existing.id },
      data: { status: "canceled" },
    });
    return { canceled: true as const };
  }

  const paidAmountRub = parsePaidAmountRub(remote.data.amount);
  if (paidAmountRub === null || paidAmountRub <= 0) {
    return { error: "Некорректная сумма платежа" as const };
  }

  if (paidAmountRub !== existing.amountRub) {
    console.warn(
      "[yookassa] amount mismatch, accepting succeeded payment:",
      paidAmountRub,
      existing.amountRub,
      yookassaId
    );
  }

  const receiptUrl = extractYookassaReceiptUrl(remote.data);
  const teacherId = existing.teacherId;

  await prisma.$transaction(async (tx) => {
    const current = await tx.subscriptionPayment.findUnique({
      where: { id: existing.id },
    });

    if (!current || current.status === "succeeded") return;

    const teacher = await tx.teacher.findUnique({
      where: { id: teacherId },
      select: { subscriptionEndsAt: true },
    });

    if (!teacher) {
      throw new Error("Teacher not found for payment");
    }

    const endsAt = computeSubscriptionEndDate(teacher.subscriptionEndsAt);

    await tx.subscriptionPayment.update({
      where: { id: existing.id },
      data: {
        status: "succeeded",
        paidAt: new Date(),
        receiptUrl,
      },
    });

    await tx.teacher.update({
      where: { id: teacherId },
      data: {
        subscriptionStatus: "active",
        subscriptionEndsAt: endsAt,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  revalidatePath("/settings");

  await notifySubscriptionPaid(existing.id);

  return { succeeded: true as const, teacherId };
}
