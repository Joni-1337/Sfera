export const SUBSCRIPTION_PRICE_RUB_DEFAULT = 1990;

export const TRIAL_DAYS = 3;

function parseSubscriptionPriceRub(raw?: string | null): number {
  if (!raw?.trim()) return SUBSCRIPTION_PRICE_RUB_DEFAULT;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : SUBSCRIPTION_PRICE_RUB_DEFAULT;
}

/** Актуальная цена подписки (сервер, в т.ч. ЮKassa). */
export function getSubscriptionPriceRub(): number {
  return parseSubscriptionPriceRub(
    process.env.SUBSCRIPTION_PRICE_RUB ??
      process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_RUB
  );
}

/** Для UI. Берётся из NEXT_PUBLIC_SUBSCRIPTION_PRICE_RUB при сборке. */
export const SUBSCRIPTION_PRICE_RUB = parseSubscriptionPriceRub(
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_RUB ??
    process.env.SUBSCRIPTION_PRICE_RUB
);



export type PlanType = "trial" | "pro" | "expired";



export type TeacherSubscription = {

  plan: PlanType;

  status: string;

  trialEndsAt: Date | null;

  subscriptionEndsAt: Date | null;

  activeGroupCount: number;

  totalStudentCount: number;

  canCreateGroup: boolean;

  canAddStudent: boolean;

  daysLeftTrial: number | null;

  daysLeftPro: number | null;

};



export function daysUntil(date: Date | null): number | null {

  if (!date) return null;

  const diff = date.getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

}



export function trialEndDate(from = new Date()) {

  const end = new Date(from);

  end.setDate(end.getDate() + TRIAL_DAYS);

  return end;

}



export function computePlan(teacher: {

  subscriptionStatus: string;

  trialEndsAt: Date | null;

  subscriptionEndsAt: Date | null;

}): PlanType {

  const now = new Date();



  if (

    teacher.subscriptionStatus === "active" &&

    teacher.subscriptionEndsAt &&

    teacher.subscriptionEndsAt > now

  ) {

    return "pro";

  }



  if (

    teacher.subscriptionStatus === "trial" &&

    teacher.trialEndsAt &&

    teacher.trialEndsAt > now

  ) {

    return "trial";

  }



  return "expired";

}



export function hasFullAccess(plan: PlanType) {

  return plan === "trial" || plan === "pro";

}



export function planLabel(plan: PlanType) {

  switch (plan) {

    case "trial":

      return "Пробный период";

    case "pro":

      return "Подписка";

    case "expired":

      return "Требуется подписка";

  }

}

