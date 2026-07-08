import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  Users,
  BarChart3,
  Sparkles,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { SferaSphereIcon } from "@/components/branding/SferaSphereIcon";
import { APP_NAME } from "@/lib/branding";
import { SUBSCRIPTION_PRICE_RUB, TRIAL_DAYS } from "@/lib/subscription-shared";

const FEATURES = [
  {
    icon: Users,
    title: "Группы и ученики",
    text: "Создавайте группы, выдавайте ключи — ученики входят без email.",
  },
  {
    icon: ClipboardList,
    title: "Задания",
    text: "Шаблоны по темам ЕГЭ, ручной ввод или импорт из Excel.",
  },
  {
    icon: FlaskConical,
    title: "Тесты ЕГЭ",
    text: "Пробные варианты из банка с автоматической проверкой.",
  },
  {
    icon: BarChart3,
    title: "Статистика",
    text: "Результаты по группам, ученикам и каждому заданию.",
  },
  {
    icon: BookOpen,
    title: "Тексты",
    text: "Библиотека для анализа и свои материалы.",
  },
  {
    icon: Sparkles,
    title: "Словарь",
    text: "Сложные слова по темам — ученики отмечают выученные.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Регистрация",
    text: `${TRIAL_DAYS} дня полного доступа без карты.`,
  },
  {
    step: "02",
    title: "Группа и ученики",
    text: "Добавьте класс и выдайте ключи доступа.",
  },
  {
    step: "03",
    title: "Задания и контроль",
    text: "Назначайте работы, смотрите результаты в одном месте.",
  },
] as const;

export default function HomeLanding() {
  return (
    <MarketingShell activeNav="home">
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {TRIAL_DAYS} дня бесплатно для преподавателей
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Подготовка к ЕГЭ
              <span className="mt-2 block bg-gradient-to-r from-accent via-teal-300 to-teal-400 bg-clip-text text-transparent">
                в одной сфере
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-text-secondary lg:mx-0">
              <span className="font-medium text-text-primary">{APP_NAME}</span>{" "}
              — платформа для репетиторов и учителей: группы, задания, тесты,
              статистика и словарь для учеников.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Попробовать бесплатно
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-border bg-bg-card/50 px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
              >
                Войти как ученик
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-muted lg:justify-start">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Ученики бесплатно
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Импорт из Excel
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Аналитика
              </li>
            </ul>
          </div>

          <div className="relative mx-auto flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64 lg:mx-0 lg:h-72 lg:w-72">
            <div className="absolute inset-0 rounded-full bg-accent/10 blur-2xl" />
            <div className="absolute inset-4 rounded-full border border-accent/20 bg-bg-card/40 backdrop-blur-sm" />
            <SferaSphereIcon size={160} className="relative drop-shadow-[0_0_40px_rgba(20,184,166,0.35)]" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Всё для подготовки к экзамену</h2>
          <p className="mt-2 text-text-secondary">
            Инструменты преподавателя и личный кабинет ученика
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-bg-card/60 p-5 transition-colors hover:border-accent/30 hover:bg-bg-card"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/15">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-text-secondary">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-bg-card/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Как начать</h2>
            <p className="mt-2 text-text-secondary">Три шага до первой группы</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ step, title, text }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-border bg-bg-card p-6"
              >
                <span className="step-number text-3xl font-bold">{step}</span>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <HighlightCard
            icon={FileSpreadsheet}
            title="Excel-импорт"
            text="Загружайте вопросы и слова из таблиц — не набирайте вручную."
          />
          <HighlightCard
            icon={Bell}
            title="Уведомления"
            text="Ученики видят новые задания и дедлайны в колокольчике."
          />
          <HighlightCard
            icon={BarChart3}
            title="Аналитика группы"
            text="Кто сдал, средний балл, кто давно не заходил — на одном экране."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-bg-card to-bg-card p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <p className="relative text-sm font-medium uppercase tracking-wider text-accent">
            Тариф для преподавателей
          </p>
          <p className="relative mt-3 text-4xl font-bold sm:text-5xl">
            {SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽
            <span className="text-lg font-normal text-text-muted"> / мес</span>
          </p>
          <div className="relative mx-auto mt-3 max-w-md text-sm text-text-secondary">
            <p>{TRIAL_DAYS} дня бесплатно, затем подписка.</p>
            <p className="mt-1">Ученики ваших групп — без оплаты.</p>
          </div>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Начать бесплатно
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text-secondary hover:border-accent/30 hover:text-accent"
            >
              Подробнее о тарифах
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-bg-card/50 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-elevated">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{text}</p>
      </div>
    </div>
  );
}
