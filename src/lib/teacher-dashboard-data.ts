import { prisma } from "@/lib/prisma";

export type AttentionItem = {
  id: string;
  type:
    | "draft_assignment"
    | "draft_test"
    | "low_completion"
    | "inactive_student"
    | "deadline_soon"
    | "deadline_overdue";
  title: string;
  subtitle: string;
  href: string;
  priority: number;
};

export type RecentActivity = {
  id: string;
  studentName: string;
  groupName: string;
  taskName: string;
  score: number;
  maxScore: number;
  completedAt: Date;
};

export type GroupWithStats = {
  id: string;
  name: string;
  studentCount: number;
  assignmentCount: number;
  testCount: number;
  avgScore: number | null;
};

export type TeacherDashboardStats = {
  totalStudents: number;
  publishedAssignments: number;
  draftAssignments: number;
  publishedTests: number;
  draftTests: number;
  avgScore: number;
  weeklySubmissions: number;
};

export type TeacherDashboardPayload = {
  fullName: string;
  groups: GroupWithStats[];
  stats: TeacherDashboardStats;
  attention: AttentionItem[];
  recentActivity: RecentActivity[];
  firstGroupId: string | null;
};

function uniqueCompletedStudents(
  attempts: { studentId: string }[]
): number {
  return new Set(attempts.map((a) => a.studentId)).size;
}

export async function getTeacherDashboardData(
  teacherId: string,
  showArchived: boolean
): Promise<TeacherDashboardPayload | null> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const inactiveThreshold = new Date();
  inactiveThreshold.setDate(inactiveThreshold.getDate() - 14);

  const deadlineSoon = new Date();
  deadlineSoon.setDate(deadlineSoon.getDate() + 7);

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      groups: {
        where: { archived: showArchived },
        include: {
          _count: { select: { students: true, assignments: true, tests: true } },
          students: {
            select: {
              id: true,
              fullName: true,
              results: {
                orderBy: { completedAt: "desc" },
                take: 1,
                select: { completedAt: true },
              },
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              published: true,
              dueAt: true,
              attempts: {
                where: { status: "completed" },
                select: { studentId: true },
              },
            },
          },
          tests: {
            select: {
              id: true,
              title: true,
              published: true,
              dueAt: true,
              attempts: {
                where: { status: "completed" },
                select: { studentId: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!teacher) return null;

  const groupIds = teacher.groups.map((g) => g.id);

  const [recentResults, allResults, weeklyCount, resultsByGroup] =
    groupIds.length === 0
      ? [[], [], 0, []]
      : await Promise.all([
          prisma.result.findMany({
            where: { student: { groupId: { in: groupIds } } },
            orderBy: { completedAt: "desc" },
            take: 30,
            include: {
              student: {
                select: {
                  fullName: true,
                  group: { select: { name: true } },
                },
              },
            },
          }),
          prisma.result.findMany({
            where: { student: { groupId: { in: groupIds } } },
            select: { score: true, maxScore: true },
          }),
          prisma.result.count({
            where: {
              student: { groupId: { in: groupIds } },
              completedAt: { gte: weekAgo },
            },
          }),
          prisma.result.findMany({
            where: { student: { groupId: { in: groupIds } } },
            select: {
              score: true,
              maxScore: true,
              student: { select: { groupId: true } },
            },
          }),
        ]);

  const groupAvgMap = new Map<string, { sum: number; count: number }>();
  for (const r of resultsByGroup) {
    const gid = r.student.groupId;
    const pct = (r.score / r.maxScore) * 100;
    const cur = groupAvgMap.get(gid) ?? { sum: 0, count: 0 };
    cur.sum += pct;
    cur.count += 1;
    groupAvgMap.set(gid, cur);
  }

  let publishedAssignments = 0;
  let draftAssignments = 0;
  let publishedTests = 0;
  let draftTests = 0;
  let totalStudents = 0;

  const attention: AttentionItem[] = [];
  const now = new Date();

  for (const group of teacher.groups) {
    totalStudents += group._count.students;
    const studentCount = group._count.students;

    for (const a of group.assignments) {
      if (a.published) publishedAssignments++;
      else {
        draftAssignments++;
        attention.push({
          id: `draft-a-${a.id}`,
          type: "draft_assignment",
          title: a.title,
          subtitle: `${group.name} · черновик задания`,
          href: `/dashboard/group/${group.id}/assignments/${a.id}`,
          priority: 2,
        });
      }

      if (a.published && studentCount > 0) {
        const completed = uniqueCompletedStudents(a.attempts);
        if (completed < studentCount) {
          attention.push({
            id: `low-a-${a.id}`,
            type: "low_completion",
            title: a.title,
            subtitle: `${group.name} · сдали ${completed} из ${studentCount}`,
            href: `/dashboard/group/${group.id}/assignments/${a.id}`,
            priority: completed === 0 ? 1 : 3,
          });
        }

        if (a.dueAt) {
          const due = new Date(a.dueAt);
          if (due < now && completed < studentCount) {
            attention.push({
              id: `overdue-a-${a.id}`,
              type: "deadline_overdue",
              title: a.title,
              subtitle: `${group.name} · срок истёк`,
              href: `/dashboard/group/${group.id}/assignments/${a.id}`,
              priority: 0,
            });
          } else if (due >= now && due <= deadlineSoon) {
            attention.push({
              id: `soon-a-${a.id}`,
              type: "deadline_soon",
              title: a.title,
              subtitle: `${group.name} · скоро дедлайн`,
              href: `/dashboard/group/${group.id}/assignments/${a.id}`,
              priority: 1,
            });
          }
        }
      }
    }

    for (const t of group.tests) {
      if (t.published) publishedTests++;
      else {
        draftTests++;
        attention.push({
          id: `draft-t-${t.id}`,
          type: "draft_test",
          title: t.title,
          subtitle: `${group.name} · черновик теста`,
          href: `/tests/${t.id}`,
          priority: 2,
        });
      }

      if (t.published && studentCount > 0) {
        const completed = uniqueCompletedStudents(t.attempts);
        if (completed < studentCount) {
          attention.push({
            id: `low-t-${t.id}`,
            type: "low_completion",
            title: t.title,
            subtitle: `${group.name} · прошли ${completed} из ${studentCount}`,
            href: `/tests/${t.id}`,
            priority: completed === 0 ? 1 : 3,
          });
        }

        if (t.dueAt) {
          const due = new Date(t.dueAt);
          if (due < now && completed < studentCount) {
            attention.push({
              id: `overdue-t-${t.id}`,
              type: "deadline_overdue",
              title: t.title,
              subtitle: `${group.name} · срок истёк`,
              href: `/tests/${t.id}`,
              priority: 0,
            });
          } else if (due >= now && due <= deadlineSoon) {
            attention.push({
              id: `soon-t-${t.id}`,
              type: "deadline_soon",
              title: t.title,
              subtitle: `${group.name} · скоро дедлайн`,
              href: `/tests/${t.id}`,
              priority: 1,
            });
          }
        }
      }
    }

    for (const student of group.students) {
      const last = student.results[0]?.completedAt;
      if (!last || new Date(last) < inactiveThreshold) {
        attention.push({
          id: `inactive-${student.id}`,
          type: "inactive_student",
          title: student.fullName,
          subtitle: last
            ? `${group.name} · нет активности 2+ недели`
            : `${group.name} · ещё ничего не сдавал`,
          href: `/dashboard/group/${group.id}/students`,
          priority: 4,
        });
      }
    }
  }

  const dedupedAttention: AttentionItem[] = [];
  const seenIds = new Set<string>();
  for (const item of attention.sort((a, b) => a.priority - b.priority)) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    dedupedAttention.push(item);
  }

  const avgScore =
    allResults.length > 0
      ? Math.round(
          (allResults.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) /
            allResults.length) *
            10
        ) / 10
      : 0;

  const groups: GroupWithStats[] = teacher.groups.map((g) => {
    const avg = groupAvgMap.get(g.id);
    return {
      id: g.id,
      name: g.name,
      studentCount: g._count.students,
      assignmentCount: g._count.assignments,
      testCount: g._count.tests,
      avgScore: avg ? Math.round((avg.sum / avg.count) * 10) / 10 : null,
    };
  });

  const activeGroups = await prisma.group.findMany({
    where: { teacherId, archived: false },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  return {
    fullName: teacher.fullName,
    groups,
    stats: {
      totalStudents,
      publishedAssignments,
      draftAssignments,
      publishedTests,
      draftTests,
      avgScore,
      weeklySubmissions: weeklyCount,
    },
    attention: dedupedAttention,
    recentActivity: recentResults.map((r) => ({
      id: r.id,
      studentName: r.student.fullName,
      groupName: r.student.group.name,
      taskName: r.taskName,
      score: r.score,
      maxScore: r.maxScore,
      completedAt: r.completedAt,
    })),
    firstGroupId: activeGroups[0]?.id ?? null,
  };
}
