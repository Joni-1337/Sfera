"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Sparkles, GraduationCap, User } from "lucide-react";
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

export function PricingView({
  subscription,
  isLoggedIn,
  paymentsEnabled = false,
  yookassaEnabled = false,
}: {
  subscription: TeacherSubscription | null;
  isLoggedIn: boolean;
  paymentsEnabled?: boolean;
  yookassaEnabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await startSubscriptionCheckout();
      if (result?.error) setError(result.error);
    });
  }

  const currentPlan = subscription?.plan ?? null;

  return (
    <div className="space-y-8">
      {isLoggedIn && !paymentsEnabled && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          Оплата скоро будет доступна — подключаем ЮKassa после регистрации
          самозанятости. Пока можно пользоваться пробным периодом.
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
                Активна до{" "}
                {subscription.subscriptionEndsAt.toLocaleDateString("ru-RU")}
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
          icon={GraduationCap}
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
                    disabled={pending || !paymentsEnabled}
                    className={btnRenewal}
                  >
                    {pending
                      ? "Обработка..."
                      : !paymentsEnabled
                        ? "Оплата скоро будет доступна"
                        : `Продлить · ${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес`}
                  </button>
                  <p className="mt-2 text-center text-xs text-text-muted">
                    {paymentsEnabled
                      ? yookassaEnabled
                        ? "Оплата картой через ЮKassa · +30 дней к текущему сроку"
                        : "Тестовое продление · +30 дней к текущему сроку"
                      : "Продление появится после подключения ЮKassa"}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={pending || !paymentsEnabled}
                  className={cn(btnPrimary, "mt-6 w-full py-3")}
                >
                  {pending
                    ? "Обработка..."
                    : !paymentsEnabled
                      ? "Оплата скоро будет доступна"
                      : `Оформить · ${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес`}
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
          icon={User}
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

      {isLoggedIn && (
        <p className="text-center text-xs text-text-secondary">
          {yookassaEnabled
            ? "Оплата банковской картой через ЮKassa. Подписка продлевается на 30 дней."
            : paymentsEnabled
              ? "Тестовая оплата активна (режим разработки)."
              : "Реальная оплата появится после подключения ЮKassa."}
        </p>
      )}
    </div>
  );
}

function PlanCard({
  icon: Icon,
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
  icon: React.ComponentType<{ className?: string }>;
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
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
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {f}
          </li>
        ))}
      </ul>

      {footer}
    </div>
  );
}
