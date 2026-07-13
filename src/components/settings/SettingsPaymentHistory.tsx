import Link from "next/link";
import { ExternalLink, Receipt } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type PaymentHistoryItem = {
  id: string;
  amountRub: number;
  status: string;
  description: string;
  receiptUrl: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

function statusLabel(status: string) {
  if (status === "succeeded") return "Оплачено";
  if (status === "canceled") return "Отменено";
  return "Ожидание";
}

function statusClass(status: string) {
  if (status === "succeeded") return "badge-published";
  if (status === "canceled") return "badge-status-error";
  return "badge-status-warn";
}

export function SettingsPaymentHistory({
  payments,
}: {
  payments: PaymentHistoryItem[];
}) {
  return (
    <section id="payments" className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">История платежей</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Оплаты подписки
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-card px-5 py-8 text-center">
          <Receipt className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-secondary">Платежей пока нет</p>
          <Link
            href="/pricing"
            className="mt-3 inline-block text-sm font-medium text-teal-200 hover:text-teal-100 hover:underline"
          >
            Оформить подписку
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
          <ul className="divide-y divide-border/70">
            {payments.map((payment) => {
              const when = payment.paidAt ?? payment.createdAt;

              return (
                <li
                  key={payment.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tabular-nums">
                        {payment.amountRub.toLocaleString("ru-RU")} ₽
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusClass(payment.status)
                        )}
                      >
                        {statusLabel(payment.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {payment.description || "Подписка на 30 дней"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatDateTime(when)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {payment.status === "succeeded" && payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-3 py-2 text-xs font-medium text-teal-100 transition-colors hover:bg-accent/15"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Документ
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
