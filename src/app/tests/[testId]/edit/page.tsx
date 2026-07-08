import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { EditTestForm } from "@/components/tests/EditTestForm";

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { testId } = await params;

  const test = await prisma.test.findFirst({
    where: { id: testId, group: { teacherId: session.id } },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      group: true,
    },
  });

  if (!test) notFound();
  if (test.published) redirect(`/tests/${testId}`);

  const attemptCount = await prisma.testAttempt.count({ where: { testId } });
  if (attemptCount > 0) redirect(`/tests/${testId}`);

  return (
    <AppShell>
      <EditTestForm groupName={test.group.name} test={test} />
    </AppShell>
  );
}
