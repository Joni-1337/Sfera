"use client";

import Link from "next/link";
import { ClipboardList, CheckCircle, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { formatDate, RESULT_CATEGORIES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  bestAttemptForStudent,
  countCompletedAttempts,
  isPerfectScore,
  latestAttemptForStudent,
} from "@/lib/attempts";

type Assignment = {
  id: string;
  title: string;
  category: string;
  description: string;
  allowRetake: boolean;
  dueAt: Date | null;
  _count: { questions: number };
  attempts: {
    status: string;
    score: number;
    maxScore: number;
    attemptNumber: number;
  }[];
};

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function mapAttempts(attempts: Assignment["attempts"]) {
  return attempts.map((a, i) => ({
    ...a,
    id: String(i),
    student: { id: "self" },
  }));
}

export function StudentTasksView({
  assignments,
  studentId,
}: {
  assignments: Assignment[];
  studentId: string;
}) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-20 text-center">
        <ClipboardList className="mb-4 h-12 w-12 text-text-muted" />
        <p className="text-text-secondary">Нет назначенных заданий</p>
        <p className="mt-1 text-sm text-text-muted">Преподаватель опубликует задания — они появятся здесь</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assignments.map((a) => {
        const mapped = mapAttempts(a.attempts);
        const best = bestAttemptForStudent(mapped, "self");
        const latest = latestAttemptForStudent(mapped, "self");
        const perfect = isPerfectScore(best);
        const inProgress = perfect
          ? undefined
          : mapped.find((at) => at.status === "in_progress");
        const done = !!best;
        const completedCount = countCompletedAttempts(mapped, "self");
        const canRetake = done && a.allowRetake && !perfect;
        const overdue = a.dueAt && new Date() > new Date(a.dueAt) && !done;

        const href =
          done || perfect
            ? `/tasks/${a.id}/result`
            : inProgress
              ? `/tasks/${a.id}`
              : `/tasks/${a.id}`;

        return (
          <div
            key={a.id}
            className={cn(
              "rounded-2xl border bg-bg-card p-6 transition-all",
              done ? "border-green-500/35" : "border-border hover:border-accent/30"
            )}
          >
            <Link href={href} className="group block">
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    done
                      ? "bg-green-500/25"
                      : "bg-accent/10 group-hover:bg-accent/20"
                  )}
                >
                  {done ? (
                    <CheckCircle className="h-6 w-6 text-green-300" strokeWidth={2.25} />
                  ) : overdue ? (
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <ClipboardList className="h-6 w-6 text-accent" />
                  )}
                </div>
                {best && (
                  <span className="rounded-full border border-green-500/40 bg-green-500/25 px-2.5 py-0.5 text-xs font-semibold text-green-200">
                    {best.score}/{best.maxScore}
                  </span>
                )}
              </div>
              <h3 className="mb-1 font-semibold group-hover:text-accent">{a.title}</h3>
              {best && completedCount > 0 && (
                <p className="mb-1 text-xs text-text-muted">
                  Попытка #{best.attemptNumber}
                  {completedCount > 1 && ` · ${completedCount} сдач`}
                </p>
              )}
              {inProgress && !done && (
                <p className="mb-1 text-xs text-yellow-400">
                  Попытка #{inProgress.attemptNumber} · в процессе
                </p>
              )}
              <p className="mb-2 text-sm text-text-secondary">{categoryLabel(a.category)}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>{a._count.questions} вопросов</span>
                {a.dueAt && (
                  <span className={cn("flex items-center gap-1", overdue && "text-red-400")}>
                    <Clock className="h-3 w-3" />
                    до {formatDate(a.dueAt)}
                  </span>
                )}
              </div>
            </Link>
            {canRetake && latest && (
              <Link
                href={`/tasks/${a.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                Пересдать
              </Link>
            )}
            {inProgress && !perfect && (
              <p className="mt-3 text-xs text-yellow-400">Есть незавершённая попытка</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
