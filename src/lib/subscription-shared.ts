export const SUBSCRIPTION_PRICE_RUB = 1990;

export const TRIAL_DAYS = 3;



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

