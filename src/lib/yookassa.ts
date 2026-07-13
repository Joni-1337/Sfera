import "server-only";

import { randomUUID } from "crypto";
import { APP_NAME } from "@/lib/branding";
import { getSubscriptionPriceRub } from "@/lib/subscription-shared";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

export type YookassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled";

type YookassaPayment = {
  id: string;
  status: YookassaPaymentStatus;
  paid: boolean;
  amount?: { value: string; currency: string };
  confirmation?: { confirmation_url?: string };
  metadata?: Record<string, string>;
  receipt_registration?: "pending" | "succeeded" | "canceled";
  receipt_ofd_url?: string;
};

export function isYookassaReceiptsEnabled() {
  if (process.env.YOOKASSA_SEND_RECEIPTS === "false") return false;
  if (process.env.YOOKASSA_SEND_RECEIPTS !== "true") return false;
  return isYookassaConfigured();
}

export function isYookassaConfigured() {
  return Boolean(
    process.env.YOOKASSA_SHOP_ID?.trim() &&
      process.env.YOOKASSA_SECRET_KEY?.trim()
  );
}

export function isPaymentsEnabled() {
  return (
    isYookassaConfigured() ||
    process.env.NODE_ENV === "development" ||
    process.env.SUBSCRIPTION_STUB === "true"
  );
}

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID!.trim();
  const secret = process.env.YOOKASSA_SECRET_KEY!.trim();
  const encoded = Buffer.from(`${shopId}:${secret}`).toString("base64");
  return `Basic ${encoded}`;
}

async function yookassaRequest<T>(
  path: string,
  init?: RequestInit & { idempotenceKey?: string }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { idempotenceKey, ...requestInit } = init ?? {};

  try {
    const response = await fetch(`${YOOKASSA_API}${path}`, {
      ...requestInit,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        ...(idempotenceKey ? { "Idempotence-Key": idempotenceKey } : {}),
        ...requestInit.headers,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("[yookassa] API error:", response.status, body);
      return { ok: false, error: "Не удалось создать платёж. Попробуйте позже." };
    }

    return { ok: true, data: JSON.parse(body) as T };
  } catch (error) {
    console.error("[yookassa] request failed:", error);
    return { ok: false, error: "Ошибка соединения с платёжной системой." };
  }
}

export async function createYookassaPayment(input: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
  customerEmail?: string | null;
}) {
  const value = input.amountRub.toFixed(2);

  const payload: Record<string, unknown> = {
    amount: { value, currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: input.returnUrl,
    },
    description: input.description,
    metadata: input.metadata,
  };

  const customerEmail = input.customerEmail?.trim();
  if (isYookassaReceiptsEnabled() && customerEmail) {
    payload.receipt = {
      customer: { email: customerEmail },
      items: [
        {
          description: input.description.slice(0, 128),
          quantity: "1.00",
          amount: { value, currency: "RUB" },
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: "service",
        },
      ],
    };
  }

  return yookassaRequest<YookassaPayment>("/payments", {
    method: "POST",
    idempotenceKey: randomUUID(),
    body: JSON.stringify(payload),
  });
}

export function extractYookassaReceiptUrl(payment: YookassaPayment) {
  return payment.receipt_ofd_url?.trim() || null;
}

export async function fetchYookassaPayment(paymentId: string) {
  return yookassaRequest<YookassaPayment>(`/payments/${paymentId}`);
}

export function yookassaPaymentDescription() {
  return `Подписка ${APP_NAME} на 30 дней`;
}

export function yookassaAmountRub() {
  return getSubscriptionPriceRub();
}
