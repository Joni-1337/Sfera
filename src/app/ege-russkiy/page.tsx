import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Users,
} from "lucide-react";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { EgeRusskiyPageJsonLd } from "@/components/seo/MarketingJsonLd";
import { APP_NAME } from "@/lib/branding";
import { buildPageMetadata } from "@/lib/seo";
import { SUBSCRIPTION_PRICE_RUB, TRIAL_DAYS } from "@/lib/subscription-shared";

export const metadata: Metadata = buildPageMetadata({
  title: "ЕГЭ русский — подготовка онлайн на платформе СФЕРА",
  description: `Подготовка к ЕГЭ по русскому языку онлайн: задания, тесты, группы учеников и аналитика для репетиторов. ${APP_NAME} — ${TRIAL_DAYS} дня бесплатно для преподавателей.`,
  path: "/ege-russkiy",
});

const POINTS = [
  {
    icon: Users,
    title: "Группы учеников",
    text: "Создайте класс, выдайте ключи — ученики заходят без регистрации по email.",
  },
  {
    icon: ClipboardList,
    title: "Задания ЕГЭ",
    text: "Шаблоны по темам экзамена, свой контент или импорт из Excel.",
  },
  {
    icon: FlaskConical,
    title: "Пробные тесты",
    text: "Варианты в формате ЕГЭ с автоматической проверкой и статистикой.",
  },
  {
    icon: BarChart3,
    title: "Прогресс и баллы",
    text: "Видно, кто сдал, средний результат и слабые темы по группе.",
  },
  {
    icon: BookOpen,
    title: "Тексты и словарь",
    text: "Библиотека для анализа текстов и словарь сложных слов по темам.",
  },
] as const;

export default function EgeRusskiyPage() {
  return (
    <MarketingShell activeNav="home">
      <EgeRusskiyPageJsonLd />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">
          {APP_NAME}
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          ЕГЭ русский — подготовка онлайн для репетиторов и учителей
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-secondary">
          Ищете удобный сервис для подготовки к{" "}
          <strong className="font-medium text-text-primary">
            ЕГЭ по русскому языку
          </strong>
          ? Платформа {APP_NAME} объединяет группы, задания, тесты и аналитику —
          чтобы вы тратили меньше времени на организацию и больше на обучение.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Попробовать {TRIAL_DAYS} дня бесплатно
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text-secondary hover:border-accent/30 hover:text-accent"
          >
            Тарифы · {SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽/мес
          </Link>
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Ученики бесплатно
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Без привязки карты на пробном периоде
          </li>
        </ul>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">
            Почему репетиторы выбирают {APP_NAME} для ЕГЭ русский
          </h2>
          <p className="mt-3 text-text-secondary">
            Вместо разрозненных таблиц и чатов — один кабинет: назначили задание,
            ученик выполнил, результат и статистика уже на дашборде.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-bg-card/60 p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border border-accent/25 bg-accent/5 p-6 sm:p-8">
          <h2 className="text-xl font-bold">
            Кому подойдёт платформа для подготовки к ЕГЭ по русскому
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-secondary">
            <li>— репетиторам с несколькими учениками и мини-группами;</li>
            <li>— учителям, которые ведут подготовку к ЕГЭ в школе или онлайн;</li>
            <li>— тем, кому нужны тесты, статистика и словарь в одном сервисе.</li>
          </ul>
          <Link
            href="/"
            className="mt-5 inline-block text-sm font-medium text-teal-200 hover:text-teal-100 hover:underline"
          >
            На главную {APP_NAME}
          </Link>
        </section>
      </article>

      <HomeFaqSection />
    </MarketingShell>
  );
}
