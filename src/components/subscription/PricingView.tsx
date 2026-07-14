"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { PlanRoleIcon } from "@/components/ui/PlanRoleIcon";
import { SuccessCheckIcon } from "@/components/ui/SuccessCheckIcon";
import { reachMetrikaGoal } from "@/lib/metrika-client";
import { METRIKA_GOALS } from "@/lib/metrika-goals";
import { startSubscriptionCheckout } from "@/lib/subscription-actions";
import {
  SUBSCRIPTION_PRICE_RUB,
  TRIAL_DAYS,
  planLabel,
  type TeacherSubscription,
} from "@/lib/subscription-shared";
import { cn } from "@/lib/utils";
import { btnPrimary } from "@/lib/button-styles";

const btnRenewal =
  "w-full rounded-xl bg-gradient-to-r from-amber-400 to-accent py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40 transition-all hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50";

const PRO_FEATURES = [
  "Неограниченное число групп",
  "Неограниченное число учеников",
  "Задания, тесты и импорт из Excel",
  "Статистика и экспорт результатов",
  "Словарь сложных слов",
  "Свои тексты для группы",
];

const STUDENT_FEATURES = [
  "Вход по ключу от преподавателя",
  "Задания, тесты и словарь",
  "Результаты и прогресс",
  "Уведомления о дедлайнах",
];

function formatSubscriptionDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ru-RU");
}

export function PricingView({
  subscription,
  isLoggedIn,
  paymentsEnabled = false,
}: {
  subscription: TeacherSubscription | null;
  isLoggedIn: boolean;
  paymentsEnabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const checkoutBusy = isSubmitting || pending;

  function handleSubscribe() {
    if (submittingRef.current || checkoutBusy) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await startSubscriptionCheckout();
        if ("error" in result) {
          setError(result.error);
          return;
        }
        reachMetrikaGoal(METRIKA_GOALS.paymentCheckout);
        if (result.redirectTo.startsWith("http")) {
          window.location.href = result.redirectTo;
          return;
        }
        router.push(result.redirectTo);
        router.refresh();
      } catch {
        setError("Не удалось оформить подписку. Попробуйте ещё раз.");
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    });
  }

  const currentPlan = subscription?.plan ?? null;

  return (
    <div className="space-y-8">
      {isLoggedIn && !paymentsEnabled && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          Оплата скоро будет доступна. Пока можно пользоваться пробным периодом.
        </div>
      )}

      {subscription && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <p className="text-sm text-text-secondary">Ваш текущий тариф</p>
          <p className="mt-1 text-xl font-bold">{planLabel(subscription.plan)}</p>
          {subscription.plan === "trial" && subscription.daysLeftTrial !== null && (
            <p className="mt-1 text-sm font-medium text-teal-300">
              Осталось {subscription.daysLeftTrial}{" "}
              {subscription.daysLeftTrial === 1 ? "день" : "дн."} пробного периода
            </p>
          )}
          {subscription.plan === "pro" && subscription.subscriptionEndsAt && (
            <>
              <p className="mt-1 text-sm text-text-muted">
                Активна до {formatSubscriptionDate(subscription.subscriptionEndsAt)}
              </p>
              {subscription.daysLeftPro !== null && subscription.daysLeftPro <= 7 && (
                <p className="mt-1 text-sm font-medium text-amber-300">
                  Осталось {subscription.daysLeftPro}{" "}
                  {subscription.daysLeftPro === 1 ? "день" : "дн."} — можно продлить заранее
                </p>
              )}
            </>
          )}
          {subscription.plan === "expired" && (
            <p className="mt-1 text-sm text-yellow-400">
              Пробный период истёк. Оформите подписку для полного доступа.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          role="teacher"
          name="Преподаватель"
          subtitle="Для преподавателей"
          price={`${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽`}
          period="в месяц"
          features={PRO_FEATURES}
          highlighted
          badge={
            currentPlan === "trial"
              ? "Пробный период"
              : `${TRIAL_DAYS} дня бесплатно`
          }
          current={currentPlan === "pro" || currentPlan === "trial"}
          footer={
            isLoggedIn ? (
              currentPlan === "pro" ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={checkoutBusy || !paymentsEnabled}
                    className={btnRenewal}
                  >
                    {checkoutBusy ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Переход к оплате...
                      </span>
                    ) : !paymentsEnabled ? (
                      "Оплата скоро будет доступна"
                    ) : (
                      `Продлить · ${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес`
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs text-text-muted">
                    {paymentsEnabled
                      ? "+30 дней к текущему сроку"
                      : "Продление скоро будет доступно"}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={checkoutBusy || !paymentsEnabled}
                  className={cn(btnPrimary, "mt-6 w-full py-3")}
                >
                  {checkoutBusy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Переход к оплате...
                    </span>
                  ) : !paymentsEnabled ? (
                    "Оплата скоро будет доступна"
                  ) : (
                    `Оформить · ${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес`
                  )}
                </button>
              )
            ) : (
              <Link
                href="/register"
                className="mt-6 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Начать бесплатно · {TRIAL_DAYS} дня
              </Link>
            )
          }
        />

        <PlanCard
          role="student"
          name="Ученик"
          subtitle="Бесплатно"
          price="0 ₽"
          period="навсегда"
          features={STUDENT_FEATURES}
          footer={
            <Link
              href="/login"
              className="mt-6 block w-full rounded-xl border border-border py-3 text-center text-sm font-semibold text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
            >
              Войти с ключом доступа
            </Link>
          }
        />
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Пробный период — {TRIAL_DAYS} дня</h2>
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          При регистрации преподаватель получает полный доступ на {TRIAL_DAYS} дня
          без привязки карты. После окончания — подписка {SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")}{" "}
          ₽/мес. Ученики, которых вы добавите в группы, пользуются платформой
          бесплатно.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {isLoggedIn && paymentsEnabled && (
        <p className="text-center text-xs text-text-secondary">
          Подписка продлевается на 30 дней после оплаты.
        </p>
      )}
    </div>
  );
}

function PlanCard({
  role,
  name,
  subtitle,
  price,
  period,
  features,
  current,
  highlighted,
  badge,
  footer,
}: {
  role: "teacher" | "student";
  name: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  current?: boolean;
  highlighted?: boolean;
  badge?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        highlighted
          ? "border-accent/40 bg-gradient-to-b from-accent/10 to-bg-card"
          : "border-border bg-bg-card"
      )}
    >
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}

      <div className="mb-4 flex items-center gap-3">
        <PlanRoleIcon role={role} />
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>

      {current && (
        <span className="badge-current-plan mb-3 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs">
          Ваш тариф
        </span>
      )}

      <p>
        <span className="text-3xl font-bold">{price}</span>
        <span className="ml-1 text-sm text-text-muted">{period}</span>
      </p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <SuccessCheckIcon size="sm" className="mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {footer}
    </div>
  );
}
