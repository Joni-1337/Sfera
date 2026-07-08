import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TestStatsView } from "@/components/tests/TestStatsView";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { testId } = await params;

  if (session.role === "student") {
    redirect(`/tests/${testId}/take`);
  }

  const test = await prisma.test.findFirst({
    where: { id: testId, group: { teacherId: session.id } },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      group: {
        include: { students: { orderBy: { fullName: "asc" } } },
      },
      attempts: {
        orderBy: { attemptNumber: "asc" },
        include: {
          student: true,
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  orderIndex: true,
                  prompt: true,
                  correctOption: true,
                  explanation: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!test) notFound();

  return (
    <AppShell>
      <TestStatsView test={test} />
    </AppShell>
  );
}
