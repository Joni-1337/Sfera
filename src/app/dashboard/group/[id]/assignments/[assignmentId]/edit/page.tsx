import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { EditAssignmentForm } from "@/components/assignments/EditAssignmentForm";

export default async function EditAssignmentPage({
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
      group: { select: { id: true, name: true } },
    },
  });

  if (!assignment) notFound();
  if (assignment.published) {
    redirect(`/dashboard/group/${id}/assignments/${assignmentId}`);
  }

  return (
    <AppShell>
      <EditAssignmentForm
        groupId={assignment.group.id}
        groupName={assignment.group.name}
        assignment={assignment}
      />
    </AppShell>
  );
}
