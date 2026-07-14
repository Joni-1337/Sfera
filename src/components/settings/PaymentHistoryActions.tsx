"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  resumeSubscriptionPayment,
  syncSubscriptionPayment,
} from "@/lib/subscription-actions";

export function PaymentHistoryActions({ paymentId }: { paymentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleResume() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await resumeSubscriptionPayment(paymentId);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        if (result.redirectTo.startsWith("http")) {
          window.location.href = result.redirectTo;
        } else {
          router.push(result.redirectTo);
          router.refresh();
        }
      } catch {
        setError("Не удалось открыть оплату. Попробуйте ещё раз.");
      }
    });
  }

  function handleSync() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await syncSubscriptionPayment(paymentId);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Не удалось проверить статус. Попробуйте позже.");
      }
    });
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleResume}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          Продолжить оплату
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Проверить статус
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
