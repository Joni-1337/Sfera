export type GroupStatsCell = {
  score: number;
  maxScore: number;
  attemptNumber: number;
  pct: number;
} | null;

export type GroupWorkStats = {
  id: string;
  title: string;
  kind: "assignment" | "test";
  categoryLabel: string | null;
  questionCount: number;
  completedCount: number;
  avgScore: number | null;
  href: string;
};

export type GroupStudentStats = {
  id: string;
  fullName: string;
  avgScore: number | null;
  completedCount: number;
  totalWork: number;
  lastActivity: string | null;
  assignmentCells: Record<string, GroupStatsCell>;
  testCells: Record<string, GroupStatsCell>;
};

export type GroupStatsSummary = {
  studentCount: number;
  assignmentCount: number;
  testCount: number;
  workCount: number;
  avgScore: number | null;
  completionRate: number;
  weeklySubmissions: number;
  inactiveCount: number;
};

export type GroupStatsData = {
  group: { id: string; name: string };
  summary: GroupStatsSummary;
  assignments: GroupWorkStats[];
  tests: GroupWorkStats[];
  students: GroupStudentStats[];
};

export function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function scoreBg(pct: number) {
  if (pct >= 80) return "bg-green-400";
  if (pct >= 50) return "bg-yellow-400";
  return "bg-red-400";
}
