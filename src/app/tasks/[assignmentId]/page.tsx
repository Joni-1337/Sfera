import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TakeAssignmentForm } from "@/components/assignments/TakeAssignmentForm";
import { startAttempt } from "@/lib/assignment-actions";
import { shuffleWithSeed } from "@/lib/shuffle";

export default async function TakeAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      published: true,
      groupId: session.groupId,
    },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!assignment) notFound();

  const startResult = await startAttempt(assignmentId, session.id);
  if (startResult.perfect || (startResult.error && startResult.attemptId)) {
    redirect(`/tasks/${assignmentId}/result`);
  }
  if (startResult.error) {
    redirect("/tasks");
  }

  const attemptId = startResult.attemptId!;

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });

  const questions = assignment.shuffleQuestions
    ? shuffleWithSeed(assignment.questions, attemptId)
    : assignment.questions;

  return (
    <AppShell>
      <TakeAssignmentForm
        assignment={{ ...assignment, questions }}
        studentId={session.id}
        attemptId={attemptId}
        attemptNumber={attempt?.attemptNumber}
        draftAnswers={attempt?.draftAnswers ?? "{}"}
        dueAt={assignment.dueAt}
        allowRetake={assignment.allowRetake}
      />
    </AppShell>
  );
}
