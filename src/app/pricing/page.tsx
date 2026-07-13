import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTeacherSubscription } from "@/lib/subscription";
import { syncTeacherPaymentOnReturn } from "@/lib/subscription-payments";
import { isPaymentsEnabled } from "@/lib/yookassa";
import { AppShell } from "@/components/layout/AppShell";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { PricingView } from "@/components/subscription/PricingView";
import { APP_NAME } from "@/lib/branding";

async function resolvePaymentNotice(
  teacherId: string,
  payment?: string
): Promise<{ text: string; tone: "success" | "warning" | "info" } | null> {
  if (payment !== "return") return null;

  const latest = await syncTeacherPaymentOnReturn(teacherId);

  if (latest?.status === "succeeded") {
    return {
      text: "Оплата прошла успешно. Подписка активирована!",
      tone: "success",
    };
  }

  if (latest?.status === "canceled") {
    return {
      text: "Оплата не завершена. Попробуйте ещё раз.",
      tone: "warning",
    };
  }

  if (latest?.status === "pending") {
    return {
      text: "Оплата обрабатывается. Подписка активируется автоматически в течение минуты.",
      tone: "info",
    };
  }

  return {
    text: "Если оплата прошла, подписка появится автоматически в течение минуты.",
    tone: "info",
  };
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; payment?: string }>;
}) {
  const session = await getSession();
  const { success, payment } = await searchParams;

  const subscription =
    session?.role === "teacher"
      ? await getTeacherSubscription(session.id)
      : null;

  if (session?.role === "student") {
    redirect("/dashboard");
  }

  const paymentNotice =
    session?.role === "teacher"
      ? await resolvePaymentNotice(session.id, payment)
      : null;

  // Перезагрузить подписку после синхронизации оплаты
  const subscriptionAfterPayment =
    session?.role === "teacher" && payment === "return"
      ? await getTeacherSubscription(session.id)
      : subscription;

  const content = (
    <>
      <div className="mb-10 text-center sm:text-left">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
          {APP_NAME}
        </p>
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Тарифы</h1>
        <p className="max-w-xl text-text-secondary">
          Подписка для преподавателей. Ученики ваших групп пользуются платформой
          бесплатно.
        </p>
      </div>

      {success === "1" && (
        <div className="notice-success mb-6 rounded-xl px-4 py-3 text-sm">
          {subscriptionAfterPayment?.plan === "pro"
            ? "Подписка продлена на 30 дней. Спасибо!"
            : "Подписка активирована на 30 дней. Спасибо!"}
        </div>
      )}

      {paymentNotice && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            paymentNotice.tone === "success"
              ? "notice-success"
              : paymentNotice.tone === "warning"
                ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                : "border border-accent/30 bg-accent/10 text-teal-100"
          }`}
        >
          {paymentNotice.text}
        </div>
      )}

      <PricingView
        subscription={subscriptionAfterPayment}
        isLoggedIn={!!session}
        paymentsEnabled={isPaymentsEnabled()}
      />
    </>
  );

  if (session) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl">{content}</div>
      </AppShell>
    );
  }

  return (
    <MarketingShell activeNav="pricing">
      <div className="flex min-h-[calc(100vh-11rem)] flex-col">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-4 sm:px-6">
          {content}
        </div>
      </div>
    </MarketingShell>
  );
}
