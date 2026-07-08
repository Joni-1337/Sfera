export type AttemptLike = {
  id: string;
  status: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  completedAt?: Date | null;
  student: { id: string };
};

export function getStudentAttempts<T extends AttemptLike>(
  attempts: T[],
  studentId: string
): T[] {
  return attempts
    .filter((a) => a.student.id === studentId)
    .sort((a, b) => a.attemptNumber - b.attemptNumber);
}

export function bestAttemptForStudent<T extends AttemptLike>(
  attempts: T[],
  studentId: string
): T | undefined {
  const studentAttempts = getStudentAttempts(attempts, studentId);
  const completed = studentAttempts.filter((a) => a.status === "completed");

  if (completed.length === 0) {
    return studentAttempts.find((a) => a.status === "in_progress");
  }

  return completed.reduce((best, cur) => {
    if (cur.score > best.score) return cur;
    if (cur.score === best.score && cur.attemptNumber > best.attemptNumber) {
      return cur;
    }
    return best;
  });
}

export function latestAttemptForStudent<T extends AttemptLike>(
  attempts: T[],
  studentId: string
): T | undefined {
  const studentAttempts = getStudentAttempts(attempts, studentId);
  return studentAttempts[studentAttempts.length - 1];
}

export function countCompletedAttempts<T extends AttemptLike>(
  attempts: T[],
  studentId: string
): number {
  return getStudentAttempts(attempts, studentId).filter(
    (a) => a.status === "completed"
  ).length;
}

export function isPerfectScore(
  attempt?: Pick<AttemptLike, "score" | "maxScore" | "status">
): boolean {
  return (
    !!attempt &&
    attempt.status === "completed" &&
    attempt.score === attempt.maxScore &&
    attempt.maxScore > 0
  );
}

export function formatAttemptLabel(attemptNumber: number, total?: number): string {
  if (total && total > 1) {
    return `№${attemptNumber} · ${total} поп.`;
  }
  return `№${attemptNumber}`;
}
