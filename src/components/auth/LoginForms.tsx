"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GraduationCap, User } from "lucide-react";
import { loginStudent, loginTeacher } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { CheckboxField } from "@/components/ui/Checkbox";

export function LoginForms() {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStudentSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginStudent(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleTeacherSubmit(formData: FormData) {
    setError(null);
    setVerifyEmail(null);
    startTransition(async () => {
      const result = await loginTeacher(formData);
      if (result?.error) {
        setError(result.error);
        if ("needsVerification" in result && result.needsVerification && result.email) {
          setVerifyEmail(result.email);
        }
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      <div className="mb-6 flex rounded-xl bg-bg-elevated p-1">
        <button
          type="button"
          onClick={() => {
            setMode("student");
            setError(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            mode === "student"
              ? "bg-accent text-white shadow-lg shadow-accent/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <User className="h-4 w-4" />
          Ученик
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("teacher");
            setError(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            mode === "teacher"
              ? "bg-accent text-white shadow-lg shadow-accent/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Преподаватель
        </button>
      </div>

      {mode === "student" ? (
        <div>
          <h2 className="mb-1 text-lg font-semibold">Авторизация ученика</h2>
          <p className="mb-5 text-sm text-text-secondary">
            Представьтесь, пожалуйста, чтобы продолжить работу с тестами.
            Ключ доступа выдаёт преподаватель.
          </p>

          <form action={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Ваше имя
              </label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Иванов Петр Сергеевич"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Ключ доступа
              </label>
              <input
                name="accessKey"
                type="text"
                required
                placeholder="STUDENT1"
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
              {pending ? "Вход..." : "Представиться"}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2 className="mb-1 text-lg font-semibold">Вход преподавателя</h2>
          <p className="mb-5 text-sm text-text-secondary">
            Войдите в личный кабинет для управления группами и учениками.
          </p>

          <form action={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="teacher@example.com"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            {verifyEmail && (
              <p className="rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
                <Link
                  href={`/register/check-email?email=${encodeURIComponent(verifyEmail)}`}
                  className="underline hover:text-yellow-200"
                >
                  Отправить письмо подтверждения ещё раз
                </Link>
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "Вход..." : "Войти"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
