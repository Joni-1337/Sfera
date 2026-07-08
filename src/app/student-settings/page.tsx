import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function StudentSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "teacher") redirect("/dashboard");

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: { group: { include: { teacher: { select: { uiTheme: true } } } } },
  });
  if (!student) redirect("/login");

  const uiTheme = student.group.teacher.uiTheme === "light" ? "light" : "dark";
  const themeLabel = uiTheme === "light" ? "Светлая" : "Тёмная";

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-3xl font-bold">Настройки</h1>
        <p className="mb-8 text-text-secondary">Ваш профиль ученика</p>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-4 font-semibold">Профиль</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-text-muted">Имя</dt>
                <dd className="font-medium">{student.fullName}</dd>
              </div>
              <div>
                <dt className="mb-1 text-text-muted">Группа</dt>
                <dd className="font-medium text-accent">{student.group.name}</dd>
              </div>
              <div>
                <dt className="mb-1 text-text-muted">Ключ доступа</dt>
                <dd className="text-text-secondary">спросите у преподавателя</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-2 font-semibold">Оформление</h2>
            <p className="text-sm text-text-secondary">
              Тему задаёт преподаватель. Сейчас:{" "}
              <span className="font-medium text-text-primary">{themeLabel}</span>
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-bg-card p-6">
            <h2 className="mb-2 font-semibold">Конфиденциальность</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Как мы обрабатываем ваши данные
            </p>
            <Link
              href="/privacy"
              className="text-sm text-accent hover:underline"
            >
              Политика обработки персональных данных →
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
