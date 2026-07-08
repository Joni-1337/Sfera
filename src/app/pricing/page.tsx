import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTeacherSubscription } from "@/lib/subscription";
import { AppShell } from "@/components/layout/AppShell";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { PricingView } from "@/components/subscription/PricingView";
import { APP_NAME } from "@/lib/branding";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await getSession();
  const { success } = await searchParams;

  const subscription =
    session?.role === "teacher"
      ? await getTeacherSubscription(session.id)
      : null;

  if (session?.role === "student") {
    redirect("/dashboard");
  }

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
          Подписка активирована на 30 дней. Спасибо!
        </div>
      )}

      <PricingView
        subscription={subscription}
        isLoggedIn={!!session}
        paymentsEnabled={
          process.env.NODE_ENV === "development" ||
          process.env.SUBSCRIPTION_STUB === "true"
        }
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
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-4 sm:px-6">{content}</div>
    </MarketingShell>
  );
}
