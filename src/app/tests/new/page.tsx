import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CreateTestForm } from "@/components/tests/CreateTestForm";

export default async function NewTestPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { groupId } = await searchParams;

  const groups = await prisma.group.findMany({
    where: { teacherId: session.id, archived: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  if (groups.length === 0) redirect("/tests");

  const preselectedGroupId =
    groupId && groups.some((group) => group.id === groupId) ? groupId : groups[0].id;

  return (
    <AppShell>
      <CreateTestForm groups={groups} preselectedGroupId={preselectedGroupId} />
    </AppShell>
  );
}
