import { redirect, notFound } from "next/navigation";
import { requireValidSession } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { StudentsManager } from "@/components/dashboard/StudentsManager";

export default async function GroupStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireValidSession();
  if (session.role !== "teacher") redirect("/login");

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, teacherId: session.id },
    select: {
      id: true,
      name: true,
      students: {
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          accessKey: true,
        },
      },
    },
  });

  if (!group) notFound();

  return (
    <AppShell>
      <StudentsManager group={group} />
    </AppShell>
  );
}
