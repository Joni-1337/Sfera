"use client";

import Link from "next/link";
import { Crown, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnPrimary } from "@/lib/button-styles";
import {
  SUBSCRIPTION_PRICE_RUB,
  type TeacherSubscription,
} from "@/lib/subscription-shared";

export function SubscriptionBanner({ sub }: { sub: TeacherSubscription }) {
  if (sub.plan === "pro") {
    if (sub.daysLeftPro !== null && sub.daysLeftPro <= 7) {
      return (
        <Banner
          variant="renewal"
          icon={Crown}
          title={`Подписка активна · осталось ${sub.daysLeftPro} ${dayWord(sub.daysLeftPro)}`}
          action={{ href: "/pricing", label: "Продлить" }}
        />
      );
    }
    return null;
  }

  if (sub.plan === "trial") {
    const days = sub.daysLeftTrial ?? 0;
    return (
      <Banner
        variant={days <= 1 ? "warning" : "trial"}
        icon={Sparkles}
        title={
          days === 0
            ? "Пробный период заканчивается сегодня"
            : `Пробный период · осталось ${days} ${dayWord(days)}`
        }
        subtitle="Полный доступ ко всем функциям. После окончания потребуется подписка."
        action={{ href: "/pricing", label: `Подписка ${SUBSCRIPTION_PRICE_RUB} ₽/мес` }}
      />
    );
  }

  return (
    <Banner
      variant="warning"
      icon={AlertTriangle}
      title="Пробный период истёк"
      subtitle={`Оформите подписку ${SUBSCRIPTION_PRICE_RUB} ₽/мес для полного доступа к платформе.`}
      action={{ href: "/pricing", label: "Оформить подписку" }}
    />
  );
}

const btnRenewal =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/30 md:px-6 md:py-3 md:text-base";

function Banner({
  variant,
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  variant: "trial" | "warning" | "renewal";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action: { href: string; label: string };
}) {
  const styles = {
    trial: "border-accent/30 bg-accent/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    renewal: "border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-bg-card to-accent/5",
  };

  const iconWrapStyles = {
    trial: "bg-accent/10 text-accent",
    warning: "bg-yellow-500/10 text-yellow-400",
    renewal:
      "bg-gradient-to-br from-amber-400 to-accent text-white shadow-sm shadow-amber-500/25",
  };

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5",
        styles[variant]
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            iconWrapStyles[variant]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug md:text-base">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-muted md:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      <Link
        href={action.href}
        className={variant === "renewal" ? btnRenewal : cn(btnPrimary, "w-full sm:w-auto")}
      >
        {action.label}
      </Link>
    </div>
  );
}

function dayWord(n: number) {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}
