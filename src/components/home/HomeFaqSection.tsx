import Link from "next/link";
import { APP_NAME } from "@/lib/branding";
import { SUBSCRIPTION_PRICE_RUB, TRIAL_DAYS } from "@/lib/subscription-shared";

export const HOME_FAQ_ITEMS = [
  {
    question: "Что такое СФЕРА?",
    answer: `${APP_NAME} — онлайн-платформа для подготовки к ЕГЭ по русскому языку. Репетиторы и учителя ведут группы, назначают задания и тесты, а ученики проходят их в личном кабинете.`,
  },
  {
    question: "Подходит ли СФЕРА для подготовки к ЕГЭ русский?",
    answer:
      "Да. На платформе есть задания и пробные тесты по формату ЕГЭ, статистика по группам, библиотека текстов и словарь сложных слов — всё для системной подготовки к экзамену по русскому языку.",
  },
  {
    question: "Для кого платформа?",
    answer:
      "Для репетиторов, учителей и преподавателей, которые готовят учеников к ЕГЭ по русскому. Ученики подключаются бесплатно по ключу от преподавателя.",
  },
  {
    question: "Сколько стоит СФЕРА?",
    answer: `Преподавателям — ${TRIAL_DAYS} дня бесплатно, затем подписка ${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽ в месяц. Ученики ваших групп пользуются платформой без оплаты.`,
  },
] as const;

export function HomeFaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-border/60 bg-bg-card/20 py-16"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
          <p className="mt-2 text-text-secondary">
            О платформе {APP_NAME} для подготовки к ЕГЭ по русскому
          </p>
        </div>
        <dl className="space-y-4">
          {HOME_FAQ_ITEMS.map(({ question, answer }) => (
            <div
              key={question}
              className="rounded-2xl border border-border/70 bg-bg-card/60 px-5 py-4"
            >
              <dt className="font-semibold">{question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text-secondary">
                {answer}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-sm text-text-muted">
          Подробнее о тарифах — на{" "}
          <Link
            href="/pricing"
            className="font-medium text-teal-200 hover:text-teal-100 hover:underline"
          >
            странице подписки
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
