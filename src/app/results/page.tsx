import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ResultsView } from "@/components/results/ResultsView";
import { getDailyWordState } from "@/lib/daily-words";

function buildStudentDetailHref(result: {
  attemptId: string | null;
  testAttemptId: string | null;
  attempt: { assignmentId: string } | null;
  testAttempt: { testId: string } | null;
}) {
  if (result.testAttemptId && result.testAttempt) {
    return `/tests/${result.testAttempt.testId}/result?attempt=${result.testAttemptId}`;
  }
  if (result.attemptId && result.attempt) {
    return `/tasks/${result.attempt.assignmentId}/result?attempt=${result.attemptId}`;
  }
  return null;
}

function buildTeacherDetailHref(
  groupId: string,
  result: {
    attempt: { assignmentId: string } | null;
    testAttempt: { testId: string } | null;
  }
) {
  if (result.testAttempt) {
    return `/tests/${result.testAttempt.testId}`;
  }
  if (result.attempt) {
    return `/dashboard/group/${groupId}/assignments/${result.attempt.assignmentId}`;
  }
  return null;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const categoryFilter = params.category;

  if (session.role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: session.id },
      include: { group: true },
    });
    if (!student) redirect("/login");

    const [results, dailyState] = await Promise.all([
      prisma.result.findMany({
        where: {
          studentId: session.id,
          ...(categoryFilter ? { category: categoryFilter } : {}),
        },
        orderBy: { completedAt: "desc" },
        include: {
          attempt: { select: { assignmentId: true } },
          testAttempt: { select: { testId: true } },
        },
      }),
      getDailyWordState(session.id, student.group.teacherId),
    ]);

    return (
      <AppShell>
        <ResultsView
          results={results.map((result) => ({
            id: result.id,
            category: result.category,
            taskName: result.taskName,
            score: result.score,
            maxScore: result.maxScore,
            completedAt: result.completedAt,
            detailHref: buildStudentDetailHref(result),
          }))}
          studentName={session.name}
          role="student"
          categoryFilter={categoryFilter}
          dailyState={dailyState}
        />
      </AppShell>
    );
  }

  const groups = await prisma.group.findMany({
    where: { teacherId: session.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      students: {
        include: {
          results: {
            ...(categoryFilter ? { where: { category: categoryFilter } } : {}),
            orderBy: { completedAt: "desc" },
            include: {
              attempt: { select: { assignmentId: true } },
              testAttempt: { select: { testId: true } },
            },
          },
        },
      },
    },
  });

  const groupResults = groups.map((group) => ({
    id: group.id,
    name: group.name,
    results: group.students.flatMap((student) =>
      student.results.map((result) => ({
        id: result.id,
        category: result.category,
        taskName: result.taskName,
        score: result.score,
        maxScore: result.maxScore,
        completedAt: result.completedAt,
        studentName: student.fullName,
        detailHref: buildTeacherDetailHref(group.id, result),
      }))
    ),
  }));

  return (
    <AppShell>
      <ResultsView
        groups={groupResults}
        studentName={session.name}
        role="teacher"
        categoryFilter={categoryFilter}
      />
    </AppShell>
  );
}
