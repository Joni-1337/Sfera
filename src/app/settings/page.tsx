import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherSubscription } from "@/lib/subscription";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { PasswordSettingsForm } from "@/components/settings/PasswordSettingsForm";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { SettingsSubscriptionCard } from "@/components/settings/SettingsSubscriptionCard";
import { SettingsQuickLinks } from "@/components/settings/SettingsQuickLinks";
import type { UiTheme } from "@/components/layout/ThemeProvider";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 mb-4 text-sm text-text-secondary">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "teacher") redirect("/dashboard");

  const [teacher, subscription] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: session.id },
      select: { uiTheme: true },
    }),
    getTeacherSubscription(session.id),
  ]);

  const uiTheme: UiTheme = teacher?.uiTheme === "light" ? "light" : "dark";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="mt-1 text-text-secondary">Аккаунт преподавателя</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-6">
            <SettingsSection
              title="Профиль"
              description="Имя отображается на дашборде и в интерфейсе"
            >
              <ProfileSettingsForm
                fullName={session.name}
                email={session.email ?? ""}
              />
            </SettingsSection>

            <SettingsSection
              title="Безопасность"
              description="Регулярно обновляйте пароль для защиты аккаунта"
            >
              <PasswordSettingsForm />
            </SettingsSection>
          </div>

          <aside className="space-y-6">
            {subscription && <SettingsSubscriptionCard sub={subscription} />}

            <SettingsSection
              title="Оформление"
              description="Тема для вас и учеников ваших групп"
            >
              <ThemeSelector currentTheme={uiTheme} />
            </SettingsSection>
          </aside>
        </div>

        <div className="mt-6">
          <SettingsQuickLinks />
        </div>
      </div>
    </AppShell>
  );
}
