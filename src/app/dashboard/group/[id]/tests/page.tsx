import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TeacherTestsView } from "@/components/tests/TeacherTestsView";

export default async function GroupTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, teacherId: session.id },
    include: {
      tests: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true, attempts: true } },
        },
      },
    },
  });

  if (!group) notFound();

  return (
    <AppShell>
      <TeacherTestsView groups={[group]} />
    </AppShell>
  );
}
