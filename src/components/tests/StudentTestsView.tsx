"use client";

import Link from "next/link";
import { FlaskConical, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { AccentIcon3D } from "@/components/ui/AccentIcon3D";
import { SuccessCheckIcon } from "@/components/ui/SuccessCheckIcon";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  bestAttemptForStudent,
  countCompletedAttempts,
  isPerfectScore,
  latestAttemptForStudent,
} from "@/lib/attempts";

type Test = {
  id: string;
  title: string;
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

function mapAttempts(attempts: Test["attempts"]) {
  return attempts.map((a, i) => ({
    ...a,
    id: String(i),
    student: { id: "self" },
  }));
}

export function StudentTestsView({
  tests,
  studentId,
}: {
  tests: Test[];
  studentId: string;
}) {
  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-20 text-center">
        <AccentIcon3D icon={FlaskConical} size="lg" variant="violet" className="mb-4" />
        <p className="text-text-secondary">Нет назначенных тестов</p>
        <p className="mt-1 text-sm text-text-muted">
          Преподаватель опубликует тесты — они появятся здесь
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tests.map((t) => {
        const mapped = mapAttempts(t.attempts);
        const best = bestAttemptForStudent(mapped, "self");
        const latest = latestAttemptForStudent(mapped, "self");
        const perfect = isPerfectScore(best);
        const inProgress = perfect
          ? undefined
          : mapped.find((at) => at.status === "in_progress");
        const done = !!best;
        const completedCount = countCompletedAttempts(mapped, "self");
        const canRetake = done && t.allowRetake && !perfect;
        const overdue = t.dueAt && new Date() > new Date(t.dueAt) && !done;

        const href =
          done || perfect ? `/tests/${t.id}/result` : `/tests/${t.id}/take`;

        return (
          <div
            key={t.id}
            className={cn(
              "rounded-2xl border bg-bg-card p-6 transition-all",
              done ? "border-green-500/35" : "border-border hover:border-accent/30"
            )}
          >
            <Link href={href} className="group block">
              <div className="mb-4 flex items-start justify-between">
                {done ? (
                  <SuccessCheckIcon size="md" />
                ) : overdue ? (
                  <AccentIcon3D icon={AlertCircle} size="md" variant="orange" />
                ) : (
                  <AccentIcon3D icon={FlaskConical} size="md" variant="violet" />
                )}
                {best && (
                  <span className="rounded-full border border-green-500/40 bg-green-500/25 px-2.5 py-0.5 text-xs font-semibold text-green-200">
                    {best.score}/{best.maxScore}
                  </span>
                )}
              </div>
              <h3 className="mb-1 font-semibold group-hover:text-accent">{t.title}</h3>
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
              <p className="mb-2 text-sm text-text-secondary">Пробный вариант ЕГЭ</p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>{t._count.questions} вопросов</span>
                {t.dueAt && (
                  <span className={cn("flex items-center gap-1", overdue && "text-red-400")}>
                    <Clock className="h-3 w-3" />
                    до {formatDate(t.dueAt)}
                  </span>
                )}
              </div>
            </Link>
            {canRetake && latest && (
              <Link
                href={`/tests/${t.id}/take`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                Пройти заново
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
