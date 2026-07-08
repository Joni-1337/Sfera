import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentResultView } from "@/components/assignments/AssignmentResultView";

export default async function AssignmentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const { assignmentId } = await params;
  const { attempt: attemptIdParam } = await searchParams;

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, groupId: session.groupId },
  });
  if (!assignment) notFound();

  const attempt = attemptIdParam
    ? await prisma.attempt.findFirst({
        where: {
          id: attemptIdParam,
          studentId: session.id,
          assignmentId,
          status: "completed",
        },
        include: {
          answers: {
            include: { question: true },
            orderBy: { question: { orderIndex: "asc" } },
          },
        },
      })
    : await prisma.attempt.findFirst({
        where: {
          studentId: session.id,
          assignmentId,
          status: "completed",
        },
        orderBy: { completedAt: "desc" },
        include: {
          answers: {
            include: { question: true },
            orderBy: { question: { orderIndex: "asc" } },
          },
        },
      });

  if (!attempt) notFound();

  return (
    <AppShell>
      <AssignmentResultView
        title={assignment.title}
        score={attempt.score}
        maxScore={attempt.maxScore}
        attemptNumber={attempt.attemptNumber}
        allowRetake={assignment.allowRetake}
        assignmentId={assignmentId}
        answers={attempt.answers}
      />
    </AppShell>
  );
}
