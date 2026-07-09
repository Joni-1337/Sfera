"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { SUBSCRIPTION_PRICE_RUB } from "@/lib/subscription-shared";
import {
  activateTeacherSubscription,
  createSubscriptionCheckout,
} from "@/lib/subscription-payments";
import { isYookassaConfigured } from "@/lib/yookassa";

/** Оформление подписки: ЮKassa или тестовая активация (SUBSCRIPTION_STUB). */
export async function startSubscriptionCheckout() {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  if (isYookassaConfigured()) {
    const checkout = await createSubscriptionCheckout(session.id);
    if ("error" in checkout && checkout.error) {
      return { error: checkout.error };
    }
    redirect(checkout.confirmationUrl!);
  }

  const allowStub =
    process.env.NODE_ENV === "development" ||
    process.env.SUBSCRIPTION_STUB === "true";

  if (!allowStub) {
    return {
      error:
        "Онлайн-оплата скоро будет доступна. Мы подключаем ЮKassa — попробуйте позже или напишите нам.",
    };
  }

  const result = await activateTeacherSubscription(session.id);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  redirect("/pricing?success=1");
}

export async function getSubscriptionPriceRub() {
  return SUBSCRIPTION_PRICE_RUB;
}
