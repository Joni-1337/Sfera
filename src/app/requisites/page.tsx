import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import {
  LEGAL_INN,
  LEGAL_OPERATOR_FULL_NAME,
  LEGAL_PHONE,
  LEGAL_STATUS,
  SITE_URL,
  isLegalInfoComplete,
} from "@/lib/legal";

export const metadata = {
  title: `Реквизиты и контакты — ${APP_NAME}`,
};

export default function RequisitesPage() {
  const complete = isLegalInfoComplete();

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-accent hover:underline"
        >
          ← На главную
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Реквизиты и контакты</h1>
        <p className="mb-8 text-sm text-text-muted">
          Информация об исполнителе услуг платформы «{APP_NAME}»
        </p>

        {!complete && (
          <p className="mb-6 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Оператору сайта: укажите ФИО и ИНН в переменных окружения{" "}
            <code className="text-xs">NEXT_PUBLIC_LEGAL_NAME</code> и{" "}
            <code className="text-xs">NEXT_PUBLIC_LEGAL_INN</code> в Vercel.
          </p>
        )}

        <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Исполнитель
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-text-muted">ФИО</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {LEGAL_OPERATOR_FULL_NAME || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Статус</dt>
                <dd className="mt-0.5 text-text-primary">{LEGAL_STATUS}</dd>
              </div>
              <div>
                <dt className="text-text-muted">ИНН</dt>
                <dd className="mt-0.5 font-mono text-text-primary">
                  {LEGAL_INN || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Контакты
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-text-muted">Сайт</dt>
                <dd className="mt-0.5">
                  <a href={SITE_URL} className="text-accent hover:underline">
                    {SITE_URL.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="contact-link hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
              {LEGAL_PHONE ? (
                <div>
                  <dt className="text-text-muted">Телефон</dt>
                  <dd className="mt-0.5 text-text-primary">{LEGAL_PHONE}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <p className="text-xs text-text-muted">
            Также см.{" "}
            <Link href="/offer" className="text-accent hover:underline">
              публичную оферту
            </Link>{" "}
            и{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              политику обработки персональных данных
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
