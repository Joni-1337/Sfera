import Link from "next/link";
import {
  BookMarked,
  CreditCard,
  LayoutDashboard,
  Mail,
  ScrollText,
  Shield,
} from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/branding";

const LINKS = [
  {
    href: "/dashboard",
    label: "Дашборд",
    description: "Группы и статистика",
    icon: LayoutDashboard,
  },
  {
    href: "/hard-words",
    label: "Словарь",
    description: "Сложные слова",
    icon: BookMarked,
  },
  {
    href: "/pricing",
    label: "Тарифы",
    description: "Подписка и оплата",
    icon: CreditCard,
  },
  {
    href: `mailto:${SUPPORT_EMAIL}`,
    label: "Поддержка",
    description: SUPPORT_EMAIL,
    icon: Mail,
    external: true,
  },
  {
    href: "/offer",
    label: "Оферта",
    description: "Условия подписки",
    icon: ScrollText,
  },
  {
    href: "/privacy",
    label: "Конфиденциальность",
    description: "Политика ПДн",
    icon: Shield,
  },
] as const;

export function SettingsQuickLinks() {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="mb-1 font-semibold">Полезные ссылки</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Быстрый переход к разделам платформы и документам
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(({ href, label, description, icon: Icon, ...rest }) => {
          const external = "external" in rest && rest.external;
          const className =
            "flex items-start gap-3 rounded-xl border border-border bg-bg-elevated/50 p-4 transition-colors hover:border-accent/30 hover:bg-bg-elevated";

          const content = (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {description}
                </p>
              </div>
            </>
          );

          if (external) {
            return (
              <a key={href} href={href} className={className}>
                {content}
              </a>
            );
          }

          return (
            <Link key={href} href={href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
