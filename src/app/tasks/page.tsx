import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { StudentTasksView } from "@/components/assignments/StudentTasksView";
import { TeacherTasksView } from "@/components/assignments/TeacherTasksView";
import { bestAttemptForStudent, isPerfectScore } from "@/lib/attempts";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "teacher") {
    const groups = await prisma.group.findMany({
      where: { teacherId: session.id, archived: false },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { questions: true, attempts: true } },
          },
        },
      },
    });

    return (
      <AppShell>
        <div>
          <h1 className="mb-2 text-3xl font-bold">Задания</h1>
          <p className="mb-8 text-text-secondary">
            Все задания по вашим группам — черновики и опубликованные
          </p>
          <TeacherTasksView groups={groups} />
        </div>
      </AppShell>
    );
  }

  const assignments = await prisma.assignment.findMany({
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

  const perfectAssignmentIds = assignments
    .filter((a) => {
      const mapped = a.attempts.map((at, i) => ({
        ...at,
        id: String(i),
        student: { id: session.id },
      }));
      return isPerfectScore(bestAttemptForStudent(mapped, session.id));
    })
    .map((a) => a.id);

  if (perfectAssignmentIds.length > 0) {
    await prisma.attempt.deleteMany({
      where: {
        studentId: session.id,
        assignmentId: { in: perfectAssignmentIds },
        status: "in_progress",
      },
    });
  }

  const cleanedAssignments = assignments.map((a) =>
    perfectAssignmentIds.includes(a.id)
      ? {
          ...a,
          attempts: a.attempts.filter((at) => at.status !== "in_progress"),
        }
      : a
  );

  return (
    <AppShell>
      <div>
        <h1 className="mb-2 text-3xl font-bold">Задания</h1>
        <p className="mb-8 text-text-secondary">
          Задания от преподавателя — выполните и сдайте
        </p>
        <StudentTasksView assignments={cleanedAssignments} studentId={session.id} />
      </div>
    </AppShell>
  );
}
