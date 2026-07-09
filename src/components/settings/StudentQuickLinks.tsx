import Link from "next/link";
import {
  BarChart3,
  BookMarked,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Pause,
  Shield,
} from "lucide-react";

const LINKS = [
  {
    href: "/dashboard",
    label: "Дашборд",
    description: "Главная страница",
    icon: LayoutDashboard,
  },
  {
    href: "/tasks",
    label: "Задания",
    description: "Текущие работы",
    icon: ClipboardList,
  },
  {
    href: "/tests",
    label: "Тесты",
    description: "Пробные варианты",
    icon: FlaskConical,
  },
  {
    href: "/results",
    label: "Результаты",
    description: "Ваши оценки",
    icon: BarChart3,
  },
  {
    href: "/hard-words",
    label: "Словарь",
    description: "Сложные слова",
    icon: BookMarked,
  },
  {
    href: "/pause",
    label: "На потом",
    description: "Отложенные материалы",
    icon: Pause,
  },
  {
    href: "/privacy",
    label: "Конфиденциальность",
    description: "Политика ПДн",
    icon: Shield,
  },
] as const;

export function StudentQuickLinks() {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="mb-1 font-semibold">Разделы платформы</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Быстрый переход к заданиям, тестам и другим разделам
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-xl border border-border bg-bg-elevated/50 p-4 transition-colors hover:border-accent/30 hover:bg-bg-elevated"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-0.5 truncate text-xs text-text-muted">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
