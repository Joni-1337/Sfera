"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerTeacher } from "@/lib/actions";
import { SUBSCRIPTION_PRICE_RUB } from "@/lib/subscription-shared";
import { CheckboxField } from "@/components/ui/Checkbox";

export function RegisterForm({ localVerify = false }: { localVerify?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerTeacher(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-1 text-lg font-semibold">Регистрация преподавателя</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Создайте аккаунт — <span className="text-accent">3 дня</span> полного доступа
        бесплатно, затем подписка {SUBSCRIPTION_PRICE_RUB} ₽/мес.
        {localVerify ? (
          <>
            {" "}
            После регистрации подтвердите email кнопкой на следующей странице (письмо
            пока не нужно).
          </>
        ) : (
          <> После регистрации подтвердите email по ссылке из письма.</>
        )}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            ФИО
          </label>
          <input
            name="fullName"
            type="text"
            required
            placeholder="Иванова Мария Петровна"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="teacher@school.ru"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            Пароль
          </label>
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

        <CheckboxField name="agreed" required>
          Я согласен с{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            политикой обработки персональных данных
          </Link>
        </CheckboxField>

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
          {pending ? "Создание..." : "Создать аккаунт"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
