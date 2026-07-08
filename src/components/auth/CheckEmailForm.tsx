"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, RefreshCw, Link2 } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions";

export function CheckEmailForm({
  email,
  devLink,
  warning,
  localMode = false,
}: {
  email: string;
  devLink?: string | null;
  warning?: string | null;
  localMode?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localDevLink, setLocalDevLink] = useState(devLink ?? null);
  const [pending, startTransition] = useTransition();

  function handleResend(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await resendVerificationEmail(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.devLink) {
        setLocalDevLink(result.devLink);
        setMessage("Ссылка для подтверждения обновлена.");
        return;
      }
      setMessage("Письмо отправлено. Проверьте почту и папку «Спам».");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        {localMode ? (
          <Link2 className="h-7 w-7 text-accent" />
        ) : (
          <Mail className="h-7 w-7 text-accent" />
        )}
      </div>

      <h2 className="mb-2 text-lg font-semibold">
        {localMode ? "Подтвердите email" : "Проверьте почту"}
      </h2>

      {localMode ? (
        <p className="mb-5 text-sm text-text-secondary">
          Домен для писем пока не подключён — это нормально для разработки. Нажмите
          ссылку ниже, чтобы подтвердить аккаунт{" "}
          <span className="font-medium text-text-primary">{email}</span> и войти.
        </p>
      ) : (
        <p className="mb-5 text-sm text-text-secondary">
          {warning ? (
            <span className="mb-2 block rounded-lg bg-yellow-500/10 px-3 py-2 text-yellow-300">
              {warning}
            </span>
          ) : null}
          Мы отправили письмо на{" "}
          <span className="font-medium text-text-primary">{email}</span>. Перейдите по
          ссылке в письме, чтобы активировать аккаунт.
        </p>
      )}

      {localDevLink && (
        <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="mb-3 text-sm font-medium text-accent">
            {localMode
              ? "Нажмите, чтобы подтвердить email:"
              : "Ссылка для подтверждения:"}
          </p>
          <a
            href={localDevLink}
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Подтвердить email и войти
          </a>
        </div>
      )}

      {!localMode && (
        <form action={handleResend} className="space-y-4">
          <input type="hidden" name="email" value={email} />

          {message && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated py-3 text-sm font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            {pending ? "Отправляем..." : "Отправить письмо ещё раз"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-text-secondary">
        Уже подтвердили?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
