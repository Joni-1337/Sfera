"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetFormAction } from "@/lib/actions";

export function ForgotPasswordForm({
  devLink = null,
  localMode = false,
}: {
  devLink?: string | null;
  localMode?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetFormAction,
    null
  );
  const error = state?.error ?? null;
  const success = state?.success ?? false;
  const link = state?.devLink ?? devLink;
  const isLocalMode = state?.localMode ?? localMode;

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-1 text-lg font-semibold">Сброс пароля</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Укажите email преподавателя — мы отправим ссылку для нового пароля.
      </p>

      {success ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
            {isLocalMode
              ? "Ссылка для сброса пароля готова (режим разработки):"
              : "Если аккаунт с таким email есть, письмо уже отправлено. Проверьте почту и папку «Спам»."}
          </p>
          {link && (
            <a
              href={link}
              className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Открыть ссылку сброса
            </a>
          )}
          <p className="text-center text-sm text-text-secondary">
            <Link href="/login" className="text-accent hover:underline">
              Вернуться ко входу
            </Link>
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="teacher@school.ru"
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
            {pending ? "Отправляем..." : "Отправить ссылку"}
          </button>

          <p className="text-center text-sm text-text-secondary">
            <Link href="/login" className="text-accent hover:underline">
              Вернуться ко входу
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
