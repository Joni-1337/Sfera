import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TakeTestForm } from "@/components/tests/TakeTestForm";
import { startTestAttempt } from "@/lib/test-actions";
import { shuffleWithSeed } from "@/lib/shuffle";

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const { testId } = await params;

  const test = await prisma.test.findFirst({
    where: {
      id: testId,
      published: true,
      groupId: session.groupId,
    },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!test) notFound();

  const startResult = await startTestAttempt(testId, session.id);
  if (startResult.perfect || (startResult.error && startResult.attemptId)) {
    redirect(`/tests/${testId}/result`);
  }
  if (startResult.error) {
    redirect("/tests");
  }

  const attemptId = startResult.attemptId!;

  const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });

  const questions = test.shuffleQuestions
    ? shuffleWithSeed(test.questions, attemptId)
    : test.questions;

  return (
    <AppShell>
      <TakeTestForm
        test={{ ...test, questions }}
        studentId={session.id}
        attemptId={attemptId}
        attemptNumber={attempt?.attemptNumber}
        draftAnswers={attempt?.draftAnswers ?? "{}"}
        dueAt={test.dueAt}
        allowRetake={test.allowRetake}
      />
    </AppShell>
  );
}
