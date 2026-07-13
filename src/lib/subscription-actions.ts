"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { getSubscriptionPriceRub as getPrice } from "@/lib/subscription-shared";
import {
  activateTeacherSubscription,
  createSubscriptionCheckout,
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

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  revalidatePath("/settings");

  return { redirectTo: "/pricing?success=1" };
}

export async function getSubscriptionPriceRub() {
  return getPrice();
}
