"use server";

import { requireTeacher } from "@/lib/auth";
import { getSubscriptionPriceRub as getPrice } from "@/lib/subscription-shared";
import {
  activateTeacherSubscription,
  createSubscriptionCheckout,
  getSubscriptionPaymentResumeUrl,
  revalidateSubscriptionPaths,
  syncSubscriptionPaymentById,
} from "@/lib/subscription-payments";
import { isYookassaConfigured } from "@/lib/yookassa";

export type SubscriptionCheckoutResult =
  | { error: string }
  | { redirectTo: string };

/** Оформление подписки: ЮKassa или тестовая активация (SUBSCRIPTION_STUB). */
export async function startSubscriptionCheckout(): Promise<SubscriptionCheckoutResult> {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  if (isYookassaConfigured()) {
    const checkout = await createSubscriptionCheckout(session.id);
    if ("error" in checkout && checkout.error) {
      return { error: checkout.error };
    }
    return { redirectTo: checkout.confirmationUrl! };
  }

  const allowStub =
    process.env.NODE_ENV === "development" ||
    process.env.SUBSCRIPTION_STUB === "true";

  if (!allowStub) {
    return {
      error:
        "Онлайн-оплата скоро будет доступна. Попробуйте позже или напишите нам.",
    };
  }

  const result = await activateTeacherSubscription(session.id, { stub: true });
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  revalidateSubscriptionPaths();

  return { redirectTo: "/pricing?success=1" };
}

export async function getSubscriptionPriceRub() {
  return getPrice();
}

export async function resumeSubscriptionPayment(
  paymentId: string
): Promise<SubscriptionCheckoutResult> {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const result = await getSubscriptionPaymentResumeUrl(session.id, paymentId);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  if (result.redirectTo === "/settings#payments") {
    revalidateSubscriptionPaths();
  }

  return { redirectTo: result.redirectTo! };
}

export async function syncSubscriptionPayment(paymentId: string) {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" as const };

  const result = await syncSubscriptionPaymentById(session.id, paymentId);
  revalidateSubscriptionPaths();
  return result;
}
