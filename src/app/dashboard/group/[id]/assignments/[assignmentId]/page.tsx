import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentStatsView } from "@/components/assignments/AssignmentStatsView";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { id, assignmentId } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, groupId: id, group: { teacherId: session.id } },
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
              question: true,
            },
          },
        },
      },
    },
  });

  if (!assignment) notFound();

  return (
    <AppShell>
      <AssignmentStatsView assignment={assignment} />
    </AppShell>
  );
}
