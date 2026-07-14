import Link from "next/link";
import { ExternalLink, Receipt } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PaymentHistoryActions } from "@/components/settings/PaymentHistoryActions";

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
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-bg-elevated/50 px-4 py-6 text-center">
        <Receipt className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">Платежей пока нет</p>
        <Link
          href="/pricing"
          className="mt-3 inline-block text-sm font-medium text-teal-200 hover:text-teal-100 hover:underline"
        >
          Оформить подписку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-h-[min(22rem,45vh)] overflow-y-auto rounded-xl border border-border/70">
      <ul className="divide-y divide-border/70">
        {payments.map((payment) => {
          const when = payment.paidAt ?? payment.createdAt;

          return (
            <li key={payment.id} className="bg-bg-elevated/20 px-4 py-3.5">
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
            {payment.status === "pending" ? (
              <PaymentHistoryActions paymentId={payment.id} />
            ) : null}
            {payment.status === "succeeded" && payment.receiptUrl ? (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-200 hover:text-teal-100 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Документ
              </a>
            ) : null}
          </li>
        );
      })}
      </ul>
    </div>
  );
}
