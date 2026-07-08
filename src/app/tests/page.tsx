import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { StudentTestsView } from "@/components/tests/StudentTestsView";
import { TeacherTestsView } from "@/components/tests/TeacherTestsView";
import { bestAttemptForStudent, isPerfectScore } from "@/lib/attempts";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const groupId = params.groupId?.trim();

  if (session.role === "teacher") {
    const groups = await prisma.group.findMany({
      where: { teacherId: session.id, archived: false },
      orderBy: { createdAt: "desc" },
      include: {
        tests: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { questions: true, attempts: true } },
          },
        },
      },
    });

    const filteredGroup = groupId ? groups.find((g) => g.id === groupId) : null;

    return (
      <AppShell>
        <div>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Тесты</h1>
              <p className="text-text-secondary">
                {filteredGroup
                  ? `Тесты группы «${filteredGroup.name}»`
                  : "Пробные варианты ЕГЭ для ваших групп"}
              </p>
            </div>
            {groups.length > 0 && (
              <Link
                href={`/tests/new?groupId=${filteredGroup?.id ?? groups[0].id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" />
                Создать тест
              </Link>
            )}
          </div>
          <TeacherTestsView
            groups={groups}
            highlightGroupId={filteredGroup ? filteredGroup.id : undefined}
          />
        </div>
      </AppShell>
    );
  }

  const tests = await prisma.test.findMany({
    where: {
      published: true,
      groupId: session.groupId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId: session.id },
        orderBy: { attemptNumber: "asc" },
        select: { status: true, score: true, maxScore: true, attemptNumber: true },
      },
    },
  });

  const perfectTestIds = tests
    .filter((t) => {
      const mapped = t.attempts.map((at, i) => ({
        ...at,
        id: String(i),
        student: { id: session.id },
      }));
      return isPerfectScore(bestAttemptForStudent(mapped, session.id));
    })
    .map((t) => t.id);

  if (perfectTestIds.length > 0) {
    await prisma.testAttempt.deleteMany({
      where: {
        studentId: session.id,
        testId: { in: perfectTestIds },
        status: "in_progress",
      },
    });
  }

  const cleanedTests = tests.map((t) =>
    perfectTestIds.includes(t.id)
      ? {
          ...t,
          attempts: t.attempts.filter((at) => at.status !== "in_progress"),
        }
      : t
  );

  return (
    <AppShell>
      <div>
        <h1 className="mb-2 text-3xl font-bold">Тесты</h1>
        <p className="mb-8 text-text-secondary">
          Проходите пробные варианты в формате ЕГЭ
        </p>
        <StudentTestsView tests={cleanedTests} studentId={session.id} />
      </div>
    </AppShell>
  );
}
