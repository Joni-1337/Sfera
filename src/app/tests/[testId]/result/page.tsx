import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TestResultView } from "@/components/tests/TestResultView";

export default async function TestResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const { testId } = await params;
  const { attempt: attemptIdParam } = await searchParams;

  const test = await prisma.test.findFirst({
    where: { id: testId, groupId: session.groupId },
  });
  if (!test) notFound();

  const attempt = attemptIdParam
    ? await prisma.testAttempt.findFirst({
        where: {
          id: attemptIdParam,
          studentId: session.id,
          testId,
          status: "completed",
        },
        include: {
          answers: {
            include: { question: true },
            orderBy: { question: { orderIndex: "asc" } },
          },
        },
      })
    : await prisma.testAttempt.findFirst({
        where: {
          studentId: session.id,
          testId,
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
      <TestResultView
        title={test.title}
        score={attempt.score}
        maxScore={attempt.maxScore}
        attemptNumber={attempt.attemptNumber}
        allowRetake={test.allowRetake}
        testId={testId}
        egeVariantNumber={test.egeVariantNumber}
        answers={attempt.answers}
      />
    </AppShell>
  );
}
