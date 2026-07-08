"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PRICE_RUB } from "@/lib/subscription-shared";

/** Тестовая активация до подключения ЮKassa. В production без флага — заглушка. */
export async function startSubscriptionCheckout() {
  const session = await requireTeacher();
  if (!session) return { error: "Необходима авторизация" };

  const allowStub =
    process.env.NODE_ENV === "development" ||
    process.env.SUBSCRIPTION_STUB === "true";

  if (!allowStub) {
    return {
      error:
        "Онлайн-оплата скоро будет доступна. Мы подключаем ЮKassa — попробуйте позже или напишите нам.",
    };
  }

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  await prisma.teacher.update({
    where: { id: session.id },
    data: {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  redirect("/pricing?success=1");
}

export async function getSubscriptionPriceRub() {
  return SUBSCRIPTION_PRICE_RUB;
}
