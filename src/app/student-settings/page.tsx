import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { StudentProfileCard } from "@/components/settings/StudentProfileCard";
import { StudentProgressCard } from "@/components/settings/StudentProgressCard";
import { StudentThemePreview } from "@/components/settings/StudentThemePreview";
import { StudentQuickLinks } from "@/components/settings/StudentQuickLinks";
import type { UiTheme } from "@/components/layout/ThemeProvider";

export default async function StudentSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "teacher") redirect("/dashboard");

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: {
      group: { include: { teacher: { select: { uiTheme: true } } } },
    },
  });
  if (!student) redirect("/login");

  const [completedAssignments, completedTests, learnedWords] = await Promise.all([
    prisma.attempt.count({
      where: { studentId: student.id, status: "completed" },
    }),
    prisma.testAttempt.count({
      where: { studentId: student.id, status: "completed" },
    }),
    prisma.hardWordProgress.count({
      where: { studentId: student.id },
    }),
  ]);

  const uiTheme: UiTheme =
    student.group.teacher.uiTheme === "light" ? "light" : "dark";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="mt-1 text-text-secondary">Ваш профиль ученика</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <SettingsSection
            title="Профиль"
            description="Данные для входа и ваша учебная группа"
          >
            <StudentProfileCard
              fullName={student.fullName}
              groupName={student.group.name}
            />
          </SettingsSection>

          <aside className="space-y-6">
            <StudentProgressCard
              completedAssignments={completedAssignments}
              completedTests={completedTests}
              learnedWords={learnedWords}
              wordStreak={student.wordStreak}
              wordStreakBest={student.wordStreakBest}
            />

            <SettingsSection
              title="Оформление"
              description="Тему выбирает преподаватель группы"
            >
              <StudentThemePreview currentTheme={uiTheme} />
            </SettingsSection>
          </aside>
        </div>

        <div className="mt-6">
          <StudentQuickLinks />
        </div>
      </div>
    </AppShell>
  );
}
