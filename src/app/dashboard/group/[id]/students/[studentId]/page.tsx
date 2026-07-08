import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, BarChart3, BookMarked, Flame, Activity } from "lucide-react";
import { requireValidSession } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { formatDateTime, RESULT_CATEGORIES } from "@/lib/utils";
import { streakLabel } from "@/lib/daily-words-shared";

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const session = await requireValidSession();
  if (session.role !== "teacher") redirect("/login");

  const { id: groupId, studentId } = await params;

  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId: session.id },
    select: { id: true, name: true },
  });
  if (!group) notFound();

  const student = await prisma.student.findFirst({
    where: { id: studentId, groupId },
    select: {
      id: true,
      fullName: true,
      wordStreak: true,
      wordStreakBest: true,
      results: {
        orderBy: { completedAt: "desc" },
        include: {
          attempt: { select: { assignmentId: true } },
          testAttempt: { select: { testId: true } },
        },
      },
      _count: { select: { hardWordProgress: true } },
    },
  });
  if (!student) notFound();

  const scored = student.results.filter((r) => r.maxScore > 0);
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) /
            scored.length
        )
      : null;

  const recentActivity = student.results.slice(0, 5);
  const allResults = student.results;

  return (
    <AppShell>
      <div>
        <Link
          href={`/dashboard/group/${groupId}/students`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к ученикам
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{student.fullName}</h1>
          <p className="text-text-secondary">{group.name}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={BarChart3}
            label="Средний балл"
            value={avgScore !== null ? `${avgScore}%` : "—"}
          />
          <StatCard
            icon={Activity}
            label="Результатов"
            value={String(student.results.length)}
          />
          <StatCard
            icon={BookMarked}
            label="Слов выучено"
            value={String(student._count.hardWordProgress)}
          />
          <StatCard
            icon={Flame}
            label="Серия слов"
            value={streakLabel(student.wordStreak)}
            hint={
              student.wordStreakBest > 0
                ? `рекорд: ${student.wordStreakBest}`
                : undefined
            }
          />
        </div>

        {recentActivity.length > 0 && (
          <section className="mb-6 rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
            <h2 className="mb-4 font-semibold">Последняя активность</h2>
            <ul className="space-y-2">
              {recentActivity.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  groupId={groupId}
                />
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
          <h2 className="mb-4 font-semibold">Все результаты</h2>
          {allResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              Пока нет результатов
            </p>
          ) : (
            <ul className="space-y-2">
              {allResults.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  groupId={groupId}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ResultRow({
  result,
  groupId,
}: {
  result: {
    id: string;
    category: string;
    taskName: string;
    score: number;
    maxScore: number;
    completedAt: Date;
    attempt: { assignmentId: string } | null;
    testAttempt: { testId: string } | null;
  };
  groupId: string;
}) {
  const href = result.testAttempt
    ? `/tests/${result.testAttempt.testId}`
    : result.attempt
      ? `/dashboard/group/${groupId}/assignments/${result.attempt.assignmentId}`
      : null;

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{result.taskName}</p>
        <p className="truncate text-xs text-text-muted">
          {categoryLabel(result.category)} · {formatDateTime(result.completedAt)}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
        {result.score}/{result.maxScore}
      </span>
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="flex items-center gap-3 rounded-xl bg-bg-elevated/80 px-3 py-2.5 transition-colors hover:bg-bg-elevated"
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center gap-3 rounded-xl bg-bg-elevated/80 px-3 py-2.5">
        {content}
      </div>
    </li>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-3 sm:p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="text-[11px] text-text-secondary sm:text-xs">{label}</p>
      <p className="text-base font-bold sm:text-lg">{value}</p>
      {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
    </div>
  );
}
