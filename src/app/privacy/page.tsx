import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/branding";

export const metadata = {
  title: `Политика обработки персональных данных — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/register"
          className="mb-8 inline-block text-sm text-accent hover:underline"
        >
          ← Назад к регистрации
        </Link>

        <h1 className="mb-2 text-3xl font-bold">
          Политика обработки персональных данных
        </h1>
        <p className="mb-8 text-sm text-text-muted">
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              1. Общие положения
            </h2>
            <p>
              Настоящая политика определяет порядок обработки персональных данных
              пользователей платформы «{APP_NAME}» (далее — Сервис). Регистрируясь
              в Сервисе, вы соглашаетесь с условиями данной политики.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              2. Какие данные мы собираем
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">Преподаватели:</strong> ФИО, email,
                хеш пароля, данные о подписке.
              </li>
              <li>
                <strong className="text-text-primary">Ученики:</strong> ФИО, ключ доступа,
                принадлежность к группе, результаты выполнения заданий и тестов.
              </li>
              <li>
                Технические данные: cookie сессии для авторизации (JWT, срок 7 дней),
                cookie источника перехода (UTM-метки, срок 30 дней).
              </li>
              <li>
                Анонимная статистика посещений через Яндекс.Метрику (страницы,
                источники перехода, регион).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              3. Цели обработки
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Регистрация и авторизация в Сервисе</li>
              <li>Организация учебного процесса (группы, задания, тесты, результаты)</li>
              <li>Управление подпиской преподавателя</li>
              <li>Техническая поддержка работы платформы</li>
              <li>Анализ источников трафика и улучшение Сервиса</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              4. Хранение и защита
            </h2>
            <p>
              Данные хранятся на сервере оператора Сервиса. Пароли преподавателей
              хранятся в виде криптографического хеша. Доступ к данным учеников имеет
              только их преподаватель в рамках созданных групп.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              5. Передача третьим лицам
            </h2>
            <p>
              Персональные данные не передаются третьим лицам, за исключением случаев,
              предусмотренных законодательством РФ, а также при подключении платёжных
              сервисов для оплаты подписки (только данные, необходимые для
              проведения платежа) и сервиса веб-аналитики Яндекс.Метрика (обезличенные
              данные о посещениях).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              6. Права пользователя
            </h2>
            <p>
              Вы можете запросить удаление или исправление своих данных, обратившись к
              оператору Сервиса. Преподаватель может удалить учётные записи учеников
              через панель управления группой.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              7. Контакты
            </h2>
            <p>
              По вопросам обработки персональных данных:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="contact-link hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
