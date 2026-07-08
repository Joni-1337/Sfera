import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import type { UiTheme } from "@/components/layout/ThemeProvider";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "teacher") redirect("/dashboard");

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { uiTheme: true },
  });
  const uiTheme: UiTheme = teacher?.uiTheme === "light" ? "light" : "dark";

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-3xl font-bold">Настройки</h1>
        <p className="mb-8 text-text-secondary">Аккаунт преподавателя</p>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-4 font-semibold">Профиль</h2>
            <SettingsForm fullName={session.name} email={session.email ?? ""} />
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-4 font-semibold">Оформление</h2>
            <ThemeSelector currentTheme={uiTheme} />
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-2 font-semibold">Сложные слова</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Словарь для учеников по темам ЕГЭ: орфография, лексика, пунктуация и др.
              Ученики отмечают выученные слова на странице результатов.
            </p>
            <Link
              href="/hard-words"
              className="inline-block text-sm text-accent hover:underline"
            >
              Управление словарём →
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-2 font-semibold">Как создавать учеников</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
              <li>На дашборде нажмите «Добавить группу»</li>
              <li>Откройте группу → «Ученики»</li>
              <li>Добавьте ученика — получите ключ доступа</li>
              <li>
                Передайте ученику <strong className="text-text-primary">ФИО</strong> и{" "}
                <strong className="text-text-primary">ключ</strong> — он войдёт на странице
                входа как ученик
              </li>
            </ol>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Перейти к дашборду →
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
