import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CreateAssignmentForm } from "@/components/assignments/CreateAssignmentForm";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { id } = await params;

  const groups = await prisma.group.findMany({
    where: { teacherId: session.id, archived: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  if (groups.length === 0) notFound();

  const groupExists = groups.some((group) => group.id === id);
  if (!groupExists) notFound();

  const preselectedGroupId = id;

  return (
    <AppShell>
      <CreateAssignmentForm groups={groups} preselectedGroupId={preselectedGroupId} />
    </AppShell>
  );
}
