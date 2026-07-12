import Link from "next/link";
import { AlertTriangle, Crown, Sparkles } from "lucide-react";
import {
  planLabel,
  SUBSCRIPTION_PRICE_RUB,
  type TeacherSubscription,
} from "@/lib/subscription-shared";
import { btnPrimary } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

function dayWord(n: number) {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}

export function SettingsSubscriptionCard({
  sub,
}: {
  sub: TeacherSubscription;
}) {
  const styles = {
    trial: {
      icon: Sparkles,
      iconWrap: "bg-accent/10",
      iconClass: "text-accent",
      border: "border-accent/30",
    },
    pro: {
      icon: Crown,
      iconWrap:
        "bg-gradient-to-br from-amber-400 to-accent shadow-sm shadow-amber-500/25",
      iconClass: "text-white",
      border: "border-amber-400/30",
    },
    expired: {
      icon: AlertTriangle,
      iconWrap: "bg-yellow-500/10",
      iconClass: "text-yellow-400",
      border: "border-yellow-500/30",
    },
  }[sub.plan];

  const Icon = styles.icon;

  let statusLine = planLabel(sub.plan);
  if (sub.plan === "trial" && sub.daysLeftTrial !== null) {
    statusLine =
      sub.daysLeftTrial === 0
        ? "Пробный период заканчивается сегодня"
        : `Осталось ${sub.daysLeftTrial} ${dayWord(sub.daysLeftTrial)}`;
  }
  if (sub.plan === "pro" && sub.daysLeftPro !== null) {
    statusLine = `Активна · ${sub.daysLeftPro} ${dayWord(sub.daysLeftPro)}`;
  }

  return (
    <div className={cn("rounded-2xl border bg-bg-card p-6", styles.border)}>
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            styles.iconWrap
          )}
        >
          <Icon className={cn("h-5 w-5", styles.iconClass)} />
        </div>
        <div>
          <h2 className="font-semibold">{planLabel(sub.plan)}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{statusLine}</p>
        </div>
      </div>

      <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-bg-elevated/80 px-3 py-2.5">
          <dt className="text-xs text-text-muted">Группы</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {sub.activeGroupCount}
          </dd>
        </div>
        <div className="rounded-xl bg-bg-elevated/80 px-3 py-2.5">
          <dt className="text-xs text-text-muted">Ученики</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {sub.totalStudentCount}
          </dd>
        </div>
      </dl>

      {sub.plan !== "pro" ? (
        <Link href="/pricing" className={cn(btnPrimary, "w-full")}>
          {sub.plan === "expired" ? "Оформить подписку" : "Тарифы"}
        </Link>
      ) : (
        <Link href="/pricing" className={cn(btnPrimary, "w-full")}>
          Продлить · {SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес
        </Link>
      )}

      <p className="mt-3 text-center text-xs text-text-muted">
        Ученики ваших групп — бесплатно
      </p>
    </div>
  );
}
