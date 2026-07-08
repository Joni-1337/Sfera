"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, User } from "lucide-react";
import { loginStudentFormAction, loginTeacherFormAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { CheckboxField } from "@/components/ui/Checkbox";

export function LoginForms({
  verifyNotice = null,
  verifySuccess = false,
  presetEmail = "",
  resetNotice = null,
}: {
  verifyNotice?: string | null;
  verifySuccess?: boolean;
  presetEmail?: string;
  resetNotice?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"student" | "teacher">(
    presetEmail ? "teacher" : "student"
  );
  const [teacherState, teacherAction, teacherPending] = useActionState(
    loginTeacherFormAction,
    null
  );
  const [studentState, studentAction, studentPending] = useActionState(
    loginStudentFormAction,
    null
  );

  const state = mode === "teacher" ? teacherState : studentState;
  const pending = mode === "teacher" ? teacherPending : studentPending;
  const error = state?.error ?? null;
  const verifyEmail =
    mode === "teacher" && teacherState?.needsVerification
      ? teacherState.email ?? null
      : null;

  useEffect(() => {
    if (teacherState?.redirectTo) router.push(teacherState.redirectTo);
  }, [teacherState?.redirectTo, router]);

  useEffect(() => {
    if (studentState?.redirectTo) router.push(studentState.redirectTo);
  }, [studentState?.redirectTo, router]);

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/40">
      {(verifyNotice || resetNotice) && (
        <p
          className={`mb-5 rounded-lg px-3 py-2 text-sm ${
            verifySuccess || resetNotice
              ? "notice-success"
              : "bg-yellow-500/15 text-yellow-200"
          }`}
        >
          {resetNotice ?? verifyNotice}
        </p>
      )}

      <div className="mb-6 flex rounded-xl bg-bg-elevated p-1">
        <button
          type="button"
          onClick={() => setMode("student")}
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
          onClick={() => setMode("teacher")}
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

          <form action={studentAction} className="space-y-4">
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

          <form action={teacherAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={presetEmail}
                placeholder="teacher@example.com"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm text-text-secondary">Пароль</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
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
