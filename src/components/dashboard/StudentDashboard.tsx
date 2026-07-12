import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  TrendingUp,
  ClipboardList,
  FlaskConical,
  FileText,
  Clock,
  AlertCircle,
  PlayCircle,
  ChevronRight,
  BookMarked,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { bestAttemptForStudent, isPerfectScore } from "@/lib/attempts";
import { DailyWordTeaser } from "@/components/dashboard/DailyWordTeaser";
import type { DailyWordState } from "@/lib/daily-words-shared";

type CategoryStat = {
  id: string;
  label: string;
  avgPct: number | null;
  count: number;
};

type Result = {
  id: string;
  category: string;
  taskName: string;
  score: number;
  maxScore: number;
  completedAt: Date;
};

type AttemptSummary = {
  status: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
};

type WorkItem = {
  id: string;
  kind: "assignment" | "test";
  title: string;
  dueAt: Date | null;
  questionCount: number;
  status: "new" | "in_progress" | "overdue" | "retake";
  href: string;
  sortKey: number;
};

type Assignment = {
  id: string;
  title: string;
  allowRetake: boolean;
  dueAt: Date | null;
  _count: { questions: number };
  attempts: AttemptSummary[];
};

type Test = {
  id: string;
  title: string;
  allowRetake: boolean;
  dueAt: Date | null;
  _count: { questions: number };
  attempts: AttemptSummary[];
};

function mapAttempts(attempts: AttemptSummary[], studentId: string) {
  return attempts.map((a, i) => ({
    ...a,
    id: String(i),
    student: { id: studentId },
  }));
}

function buildWorkItem(
  item: Assignment | Test,
  kind: "assignment" | "test",
  studentId: string
): WorkItem | null {
  const mapped = mapAttempts(item.attempts, studentId);
  const best = bestAttemptForStudent(mapped, studentId);
  const inProgress = mapped.find((a) => a.status === "in_progress");
  const perfect = isPerfectScore(best);
  const done = !!best && best.status === "completed";
  const overdue = !!item.dueAt && new Date() > new Date(item.dueAt) && !done;

  if (perfect) return null;
  if (done && !item.allowRetake) return null;

  let status: WorkItem["status"];
  let sortKey: number;

  if (overdue && !done) {
    status = "overdue";
    sortKey = 0;
  } else if (inProgress) {
    status = "in_progress";
    sortKey = 1;
  } else if (done && item.allowRetake) {
    status = "retake";
    sortKey = 3;
  } else {
    status = "new";
    sortKey = 2;
  }

  const href =
    kind === "assignment"
      ? done
        ? `/tasks/${item.id}/result`
        : `/tasks/${item.id}`
      : done
        ? `/tests/${item.id}/result`
        : `/tests/${item.id}/take`;

  return {
    id: item.id,
    kind,
    title: item.title,
    dueAt: item.dueAt,
    questionCount: item._count.questions,
    status,
    href,
    sortKey,
  };
}

function sortWorkItems(items: WorkItem[]) {
  return [...items].sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return 0;
  });
}

const STATUS_LABELS: Record<WorkItem["status"], string> = {
  new: "Новое",
  in_progress: "В процессе",
  overdue: "Просрочено",
  retake: "Можно пересдать",
};

const STATUS_STYLES: Record<WorkItem["status"], string> = {
  new: "bg-accent/10 text-accent",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  overdue: "bg-red-500/10 text-red-400",
  retake: "bg-blue-500/10 text-blue-400",
};

const QUICK_ACTIONS = [
  { href: "/tasks", label: "Задания", icon: ClipboardList },
  { href: "/tests", label: "Тесты", icon: FlaskConical },
  { href: "/texts", label: "Тексты", icon: FileText },
  { href: "/results", label: "Результаты", icon: BarChart3 },
  { href: "/hard-words", label: "Словарь", icon: BookMarked },
] as const;

export function StudentDashboard({
  student,
  resultsCount,
  avgScore,
  categoryStats,
  assignments,
  tests,
  studentId,
  dailyState,
}: {
  student: {
    fullName: string;
    group: { name: string };
    results: Result[];
  };
  resultsCount: number;
  avgScore: number;
  categoryStats: CategoryStat[];
  assignments: Assignment[];
  tests: Test[];
  studentId: string;
  dailyState?: DailyWordState | null;
}) {
  const workItems = sortWorkItems([
    ...assignments
      .map((a) => buildWorkItem(a, "assignment", studentId))
      .filter(Boolean) as WorkItem[],
    ...tests.map((t) => buildWorkItem(t, "test", studentId)).filter(Boolean) as WorkItem[],
  ]);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Дашборд</h1>
      <p className="mb-6 text-text-secondary">
        Группа: <span className="text-accent">{student.group.name}</span>
      </p>

      <DailyWordTeaser state={dailyState ?? null} />

      <section className="mb-8 hidden md:block">
        <h2 className="mb-3 text-lg font-semibold">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-4 text-center transition-all hover:border-accent/30 md:gap-3 md:rounded-2xl md:px-5 md:py-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 md:h-12 md:w-12">
                <Icon className="h-5 w-5 text-accent md:h-6 md:w-6" />
              </div>
              <span className="text-xs font-medium leading-tight md:text-sm lg:text-base">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Что сделать сейчас</h2>
            {workItems.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {workItems.length}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          {workItems.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <PlayCircle className="mb-3 h-10 w-10 text-green-400/60" />
              <p className="text-sm text-text-secondary">Всё выполнено</p>
              <p className="mt-1 text-xs text-text-muted">
                Новые задания и тесты появятся здесь
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {workItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl bg-bg-elevated px-4 py-3 transition-all hover:bg-bg-elevated/80"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        item.kind === "assignment" ? "bg-accent/10" : "bg-teal-500/10"
                      )}
                    >
                      {item.kind === "assignment" ? (
                        <ClipboardList className="h-4 w-4 text-accent" />
                      ) : (
                        <FlaskConical className="h-4 w-4 text-teal-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            STATUS_STYLES[item.status]
                          )}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                        <span>
                          {item.kind === "assignment" ? "Задание" : "Тест"} ·{" "}
                          {item.questionCount}{" "}
                          {item.questionCount === 1
                            ? "вопрос"
                            : item.questionCount < 5
                              ? "вопроса"
                              : "вопросов"}
                        </span>
                        {item.dueAt && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1",
                              item.status === "overdue" && "text-red-400"
                            )}
                          >
                            {item.status === "overdue" ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            до {formatDate(item.dueAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Сводка</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={BarChart3} label="Средний балл" value={`${avgScore}%`} />
          <StatCard icon={BookOpen} label="Пройдено заданий" value={String(resultsCount)} />
          <StatCard
            icon={TrendingUp}
            label="Последняя активность"
            value={
              student.results[0] ? formatDate(student.results[0].completedAt) : "—"
            }
          />
        </div>
      </section>

      {categoryStats.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Прогресс по темам</h2>
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <ul className="space-y-4">
              {categoryStats.map((cat) => (
                <li key={cat.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{cat.label}</span>
                    <span className="shrink-0 text-accent">
                      {cat.avgPct !== null ? `${cat.avgPct}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${cat.avgPct ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {cat.count}{" "}
                    {cat.count === 1 ? "результат" : cat.count < 5 ? "результата" : "результатов"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Последние результаты</h2>
          <Link href="/results" className="text-sm text-accent hover:underline">
            Все результаты →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          {student.results.length === 0 ? (
            <p className="text-sm text-text-muted">Пока нет результатов</p>
          ) : (
            <ul className="space-y-3">
              {student.results.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate text-sm font-medium">{r.taskName}</p>
                    <p className="text-xs text-text-muted">
                      {formatDateTime(r.completedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    {r.score}/{r.maxScore}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
