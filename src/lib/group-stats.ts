import "server-only";

import { bestAttemptForStudent } from "@/lib/attempts";
import { RESULT_CATEGORIES } from "@/lib/utils";
import type {
  GroupStatsCell,
  GroupStatsData,
  GroupStatsSummary,
  GroupStudentStats,
  GroupWorkStats,
} from "@/lib/group-stats-shared";

export type {
  GroupStatsCell,
  GroupStatsData,
  GroupStatsSummary,
  GroupStudentStats,
  GroupWorkStats,
} from "@/lib/group-stats-shared";

type AttemptRow = {
  studentId: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  status: string;
  completedAt: Date | null;
};

type WorkSource = {
  id: string;
  title: string;
  category?: string;
  _count: { questions: number };
  attempts: AttemptRow[];
};

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function pct(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

function mapAttempts(attempts: AttemptRow[], studentId: string): GroupStatsCell {
  const mapped = attempts.map((at) => ({
    ...at,
    id: `${at.studentId}-${at.attemptNumber}`,
    student: { id: at.studentId },
  }));
  const attempt = bestAttemptForStudent(mapped, studentId);
  if (!attempt || attempt.status !== "completed") return null;
  return {
    score: attempt.score,
    maxScore: attempt.maxScore,
    attemptNumber: attempt.attemptNumber,
    pct: pct(attempt.score, attempt.maxScore),
  };
}

function buildWorkStats(
  item: WorkSource,
  kind: "assignment" | "test",
  groupId: string
): GroupWorkStats {
  const completedStudentIds = new Set(
    item.attempts.filter((a) => a.status === "completed").map((a) => a.studentId)
  );
  const scores = item.attempts
    .filter((a) => a.status === "completed" && a.maxScore > 0)
    .map((a) => pct(a.score, a.maxScore));

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null;

  return {
    id: item.id,
    title: item.title,
    kind,
    categoryLabel:
      kind === "assignment" && item.category ? categoryLabel(item.category) : null,
    questionCount: item._count.questions,
    completedCount: completedStudentIds.size,
    avgScore,
    href:
      kind === "assignment"
        ? `/dashboard/group/${groupId}/assignments/${item.id}`
        : `/tests/${item.id}`,
  };
}

export function buildGroupStatsData(input: {
  id: string;
  name: string;
  students: { id: string; fullName: string }[];
  assignments: WorkSource[];
  tests: WorkSource[];
}): GroupStatsData {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const inactiveThreshold = new Date();
  inactiveThreshold.setDate(inactiveThreshold.getDate() - 14);

  const studentCount = input.students.length;
  const assignments = input.assignments.map((a) =>
    buildWorkStats(a, "assignment", input.id)
  );
  const tests = input.tests.map((t) => buildWorkStats(t, "test", input.id));
  const workCount = assignments.length + tests.length;
  const totalSlots = studentCount * workCount;

  let weeklySubmissions = 0;
  let completedSlots = 0;
  const allCompletedPcts: number[] = [];
  let inactiveCount = 0;

  const students: GroupStudentStats[] = input.students.map((student) => {
    const assignmentCells: Record<string, GroupStatsCell> = {};
    const testCells: Record<string, GroupStatsCell> = {};
    const studentPcts: number[] = [];
    let completedCount = 0;
    let lastActivity: Date | null = null;

    for (const assignment of input.assignments) {
      const cell = mapAttempts(assignment.attempts, student.id);
      assignmentCells[assignment.id] = cell;
      if (cell) {
        completedCount++;
        completedSlots++;
        studentPcts.push(cell.pct);
        allCompletedPcts.push(cell.pct);
      }
      for (const at of assignment.attempts) {
        if (at.studentId === student.id && at.status === "completed" && at.completedAt) {
          if (at.completedAt >= weekAgo) weeklySubmissions++;
          if (!lastActivity || at.completedAt > lastActivity) {
            lastActivity = at.completedAt;
          }
        }
      }
    }

    for (const test of input.tests) {
      const cell = mapAttempts(test.attempts, student.id);
      testCells[test.id] = cell;
      if (cell) {
        completedCount++;
        completedSlots++;
        studentPcts.push(cell.pct);
        allCompletedPcts.push(cell.pct);
      }
      for (const at of test.attempts) {
        if (at.studentId === student.id && at.status === "completed" && at.completedAt) {
          if (at.completedAt >= weekAgo) weeklySubmissions++;
          if (!lastActivity || at.completedAt > lastActivity) {
            lastActivity = at.completedAt;
          }
        }
      }
    }

    if (
      workCount > 0 &&
      completedCount === 0 &&
      (!lastActivity || lastActivity < inactiveThreshold)
    ) {
      inactiveCount++;
    }

    return {
      id: student.id,
      fullName: student.fullName,
      avgScore:
        studentPcts.length > 0
          ? Math.round(studentPcts.reduce((s, v) => s + v, 0) / studentPcts.length)
          : null,
      completedCount,
      totalWork: workCount,
      lastActivity: lastActivity?.toISOString() ?? null,
      assignmentCells,
      testCells,
    };
  });

  const summary: GroupStatsSummary = {
    studentCount,
    assignmentCount: assignments.length,
    testCount: tests.length,
    workCount,
    avgScore:
      allCompletedPcts.length > 0
        ? Math.round(allCompletedPcts.reduce((s, v) => s + v, 0) / allCompletedPcts.length)
        : null,
    completionRate:
      totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0,
    weeklySubmissions,
    inactiveCount,
  };

  return {
    group: { id: input.id, name: input.name },
    summary,
    assignments,
    tests,
    students,
  };
}
