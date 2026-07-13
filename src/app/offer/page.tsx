import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import {
  LEGAL_OPERATOR_FULL_NAME,
  SUBSCRIPTION_PRICE_LABEL,
  SUBSCRIPTION_PRODUCT_NAME,
  SITE_URL,
} from "@/lib/legal";
import { SUBSCRIPTION_PRICE_RUB } from "@/lib/subscription-shared";

export const metadata = {
  title: `Публичная оферта — ${APP_NAME}`,
};

export default function OfferPage() {
  const updated = new Date().toLocaleDateString("ru-RU");

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/pricing"
          className="mb-8 inline-block text-sm text-accent hover:underline"
        >
          ← Тарифы
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Публичная оферта</h1>
        <p className="mb-8 text-sm text-text-muted">
          Договор оказания услуг (оферта). Дата публикации: {updated}
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              1. Термины
            </h2>
            <p>
              <strong className="text-text-primary">Исполнитель</strong> —{" "}
              {LEGAL_OPERATOR_FULL_NAME || "физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход» (самозанятый)"},{" "}
              оказывающее услуги через сайт {SITE_URL}.
            </p>
            <p className="mt-2">
              <strong className="text-text-primary">Заказчик</strong> — дееспособное
              физическое лицо (преподаватель), принявшее условия настоящей оферты.
            </p>
            <p className="mt-2">
              <strong className="text-text-primary">Сервис</strong> — платформа «
              {APP_NAME}» для организации учебного процесса: группы, задания, тесты,
              статистика.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              2. Предмет договора
            </h2>
            <p>
              Исполнитель предоставляет Заказчику доступ к платному функционалу
              Сервиса для преподавателей на условиях подписки.
            </p>
            <p className="mt-2">
              <strong className="text-text-primary">Услуга:</strong>{" "}
              {SUBSCRIPTION_PRODUCT_NAME}.
            </p>
            <p className="mt-2">
              <strong className="text-text-primary">Стоимость:</strong>{" "}
              {SUBSCRIPTION_PRICE_LABEL} ({SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")}{" "}
              рублей за 30 календарных дней). Цена указана на странице{" "}
              <Link href="/pricing" className="text-accent hover:underline">
                Тарифы
              </Link>
              .
            </p>
            <p className="mt-2">
              Ученики пользуются Сервисом бесплатно по приглашению преподавателя.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              3. Порядок оказания услуги (доставка)
            </h2>
            <p>
              Услуга оказывается в электронном виде через сеть Интернет. После
              успешной оплаты доступ к платному функционалу активируется
              автоматически в личном кабинете преподавателя на сайте {SITE_URL}{" "}
              в течение нескольких минут. Отдельная доставка материальных
              носителей не производится.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              4. Оплата и пробный период
            </h2>
            <p>
              Оплата производится безналичным способом на сайте. При регистрации
              преподавателю может быть
              предоставлен бесплатный пробный период — условия указаны на
              странице тарифов.
            </p>
            <p className="mt-2">
              Акцепт оферты — регистрация на сайте и/или оплата подписки.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              5. Возврат средств
            </h2>
            <p>
              В связи с нематериальным характером услуги и моментальным
              предоставлением доступа возврат оплаты возможен при технической
              невозможности оказания услуги по вине Исполнителя. Обращения:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="contact-link hover:underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              6. Реквизиты и контакты
            </h2>
            <p>
              Реквизиты Исполнителя (включая ИНН) размещены на странице{" "}
              <Link href="/requisites" className="text-accent hover:underline">
                Реквизиты и контакты
              </Link>
              . Политика обработки персональных данных —{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                здесь
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
