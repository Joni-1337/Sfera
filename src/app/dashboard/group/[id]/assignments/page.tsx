import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentsList } from "@/components/assignments/AssignmentsList";

export default async function GroupAssignmentsPage({
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
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true, attempts: true } },
          attempts: { select: { status: true } },
        },
      },
    },
  });

  if (!group) notFound();

  return (
    <AppShell>
      <AssignmentsList group={group} />
    </AppShell>
  );
}
