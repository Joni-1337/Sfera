"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordFormAction } from "@/lib/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetPasswordFormAction, null);
  const error = state?.error ?? null;

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state?.redirectTo, router]);

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-1 text-lg font-semibold">Новый пароль</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Придумайте новый пароль для входа в личный кабинет.
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Пароль</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Минимум 6 символов"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            Подтверждение пароля
          </label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="Повторите пароль"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Сохранение..." : "Сохранить пароль"}
        </button>

        <p className="text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      </form>
    </div>
  );
}
