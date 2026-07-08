import { redirect, notFound } from "next/navigation";
import { requireValidSession } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { GroupStatsView } from "@/components/assignments/GroupStatsView";
import { buildGroupStatsData } from "@/lib/group-stats";

export default async function GroupStatsPage({
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
        select: { id: true, fullName: true },
      },
      assignments: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          _count: { select: { questions: true } },
          attempts: {
            where: { status: "completed" },
            orderBy: { attemptNumber: "asc" },
            select: {
              studentId: true,
              score: true,
              maxScore: true,
              attemptNumber: true,
              status: true,
              completedAt: true,
            },
          },
        },
      },
      tests: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          _count: { select: { questions: true } },
          attempts: {
            where: { status: "completed" },
            orderBy: { attemptNumber: "asc" },
            select: {
              studentId: true,
              score: true,
              maxScore: true,
              attemptNumber: true,
              status: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });

  if (!group) notFound();

  const stats = buildGroupStatsData(group);

  return (
    <AppShell>
      <GroupStatsView data={stats} />
    </AppShell>
  );
}
