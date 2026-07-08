import { redirect } from "next/navigation";
import { requireValidSession } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { getTeacherDashboardData } from "@/lib/teacher-dashboard-data";
import { getTeacherSubscription } from "@/lib/subscription";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { getDailyWordState } from "@/lib/daily-words";
import { syncDeadlineNotifications } from "@/lib/deadline-notifications";
import { RESULT_CATEGORIES } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireValidSession();
  const { view } = await searchParams;
  const showArchived = view === "archived";

  if (session.role === "teacher") {
    const [dashboardData, subscription] = await Promise.all([
      getTeacherDashboardData(session.id, showArchived),
      getTeacherSubscription(session.id),
    ]);
    if (!dashboardData) redirect("/login");

    return (
      <AppShell>
        <TeacherDashboard
          fullName={dashboardData.fullName}
          groups={dashboardData.groups}
          stats={dashboardData.stats}
          attention={dashboardData.attention}
          recentActivity={dashboardData.recentActivity}
          firstGroupId={dashboardData.firstGroupId}
          subscription={subscription}
          showArchived={showArchived}
        />
      </AppShell>
    );
  }

  const studentId = session.id;

  const [student, resultsCount, allResults, categoryResults, assignments, tests] =
    await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        results: { orderBy: { completedAt: "desc" }, take: 5 },
        group: true,
      },
    }),
    prisma.result.count({ where: { studentId } }),
    prisma.result.findMany({
      where: { studentId },
      select: { score: true, maxScore: true },
    }),
    prisma.result.findMany({
      where: { studentId },
      select: { category: true, score: true, maxScore: true },
    }),
    prisma.assignment.findMany({
      where: { published: true, groupId: session.groupId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: "asc" },
          select: { status: true, score: true, maxScore: true, attemptNumber: true },
        },
      },
    }),
    prisma.test.findMany({
      where: { published: true, groupId: session.groupId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId },
          orderBy: { attemptNumber: "asc" },
          select: { status: true, score: true, maxScore: true, attemptNumber: true },
        },
      },
    }),
  ]);

  if (!student) redirect("/login");

  await syncDeadlineNotifications(studentId);

  const dailyState = await getDailyWordState(studentId, student.group.teacherId);

  const avgScore =
    allResults.length > 0
      ? Math.round(
          (allResults.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) /
            allResults.length) *
            10
        ) / 10
      : 0;

  const categoryStats = RESULT_CATEGORIES.map((cat) => {
    const catResults = categoryResults.filter(
      (r) => r.category === cat.id && r.maxScore > 0
    );
    if (catResults.length === 0) {
      return {
        id: cat.id,
        label: cat.label.split(" (")[0] ?? cat.label,
        avgPct: null as number | null,
        count: 0,
      };
    }
    const avgPct =
      Math.round(
        (catResults.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) /
          catResults.length) *
          10
      ) / 10;
    return {
      id: cat.id,
      label: cat.label.split(" (")[0] ?? cat.label,
      avgPct,
      count: catResults.length,
    };
  }).filter((c) => c.count > 0);

  return (
    <AppShell>
      <StudentDashboard
        student={student}
        resultsCount={resultsCount}
        avgScore={avgScore}
        categoryStats={categoryStats}
        assignments={assignments}
        tests={tests}
        studentId={studentId}
        dailyState={dailyState}
      />
    </AppShell>
  );
}
