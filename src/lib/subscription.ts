import "server-only";



import { prisma } from "@/lib/prisma";

import {

  SUBSCRIPTION_PRICE_RUB,

  computePlan,

  daysUntil,

  hasFullAccess,

  type TeacherSubscription,

} from "@/lib/subscription-shared";



export {

  SUBSCRIPTION_PRICE_RUB,

  TRIAL_DAYS,

  computePlan,

  hasFullAccess,

  trialEndDate,

  planLabel,

  type PlanType,

  type TeacherSubscription,

} from "@/lib/subscription-shared";



export async function syncExpiredSubscription(teacherId: string) {

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });

  if (!teacher) return;



  const plan = computePlan(teacher);

  if (plan === "expired" && teacher.subscriptionStatus !== "expired") {

    await prisma.teacher.update({

      where: { id: teacherId },

      data: { subscriptionStatus: "expired" },

    });

  }

}



export async function getTeacherSubscription(

  teacherId: string

): Promise<TeacherSubscription | null> {

  await syncExpiredSubscription(teacherId);



  const teacher = await prisma.teacher.findUnique({

    where: { id: teacherId },

    include: {

      groups: {

        where: { archived: false },

        include: { _count: { select: { students: true } } },

      },

    },

  });



  if (!teacher) return null;



  const plan = computePlan(teacher);

  const activeGroupCount = teacher.groups.length;

  const totalStudentCount = teacher.groups.reduce(

    (sum, g) => sum + g._count.students,

    0

  );

  const full = hasFullAccess(plan);



  return {

    plan,

    status: teacher.subscriptionStatus,

    trialEndsAt: teacher.trialEndsAt,

    subscriptionEndsAt: teacher.subscriptionEndsAt,

    activeGroupCount,

    totalStudentCount,

    canCreateGroup: full,

    canAddStudent: full,

    daysLeftTrial: plan === "trial" ? daysUntil(teacher.trialEndsAt) : null,

    daysLeftPro: plan === "pro" ? daysUntil(teacher.subscriptionEndsAt) : null,

  };

}



export async function assertCanCreateGroup(teacherId: string) {

  const sub = await getTeacherSubscription(teacherId);

  if (!sub) return { error: "Аккаунт не найден" };

  if (!sub.canCreateGroup) {

    return {

      error: `Создание групп доступно в пробном периоде или по подписке (${SUBSCRIPTION_PRICE_RUB} ₽/мес).`,

    };

  }

  return { sub };

}



export async function assertCanAddStudent(teacherId: string) {

  const sub = await getTeacherSubscription(teacherId);

  if (!sub) return { error: "Аккаунт не найден" };

  if (!sub.canAddStudent) {

    return {

      error: `Добавление учеников доступно в пробном периоде или по подписке (${SUBSCRIPTION_PRICE_RUB} ₽/мес).`,

    };

  }

  return { sub };

}



export async function assertHasFullAccess(teacherId: string) {

  const sub = await getTeacherSubscription(teacherId);

  if (!sub) return { error: "Аккаунт не найден" };

  if (!hasFullAccess(sub.plan)) {

    return {

      error: `Действие доступно в пробном периоде или по подписке (${SUBSCRIPTION_PRICE_RUB} ₽/мес).`,

    };

  }

  return { sub };

}

