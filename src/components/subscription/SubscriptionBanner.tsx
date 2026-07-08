"use client";



import Link from "next/link";

import { Clock, Sparkles, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

import {

  SUBSCRIPTION_PRICE_RUB,

  type TeacherSubscription,

} from "@/lib/subscription-shared";



export function SubscriptionBanner({ sub }: { sub: TeacherSubscription }) {

  if (sub.plan === "pro") {

    if (sub.daysLeftPro !== null && sub.daysLeftPro <= 7) {

      return (

        <Banner

          variant="info"

          icon={Clock}

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



function Banner({

  variant,

  icon: Icon,

  title,

  subtitle,

  action,

}: {

  variant: "trial" | "warning" | "info";

  icon: React.ComponentType<{ className?: string }>;

  title: string;

  subtitle?: string;

  action: { href: string; label: string };

}) {

  const styles = {

    trial: "border-accent/30 bg-accent/5",

    warning: "border-yellow-500/30 bg-yellow-500/5",

    info: "border-border bg-bg-card",

  };

  const iconStyles = {

    trial: "text-accent",

    warning: "text-yellow-400",

    info: "text-accent",

  };



  return (

    <div

      className={cn(

        "mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",

        styles[variant]

      )}

    >

      <div className="flex gap-3">

        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconStyles[variant])} />

        <div>

          <p className="text-sm font-medium">{title}</p>

          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}

        </div>

      </div>

      <Link

        href={action.href}

        className="shrink-0 rounded-xl bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"

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

