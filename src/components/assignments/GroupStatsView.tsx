"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  Activity,
  UserX,
  ChevronDown,
  Minus,
  Check,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Collapsible, chevronClass } from "@/components/ui/Collapsible";
import {
  type GroupStatsData,
  type GroupStatsCell,
  type GroupWorkStats,
  type GroupStudentStats,
  scoreColor,
  scoreBg,
} from "@/lib/group-stats-shared";

export function GroupStatsView({ data }: { data: GroupStatsData }) {
  const { group, summary, assignments, tests, students } = data;

  const studentSummaryPreview =
    summary.avgScore !== null
      ? `средний ${summary.avgScore}% · сдано ${summary.completionRate}% работ`
      : `${students.length} учеников`;

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к дашборду
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Статистика по группе</h1>
      <p className="mb-6 text-text-secondary">{group.name}</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          icon={Users}
          label="Учеников"
          value={String(summary.studentCount)}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Заданий"
          value={String(summary.assignmentCount)}
        />
        <SummaryCard
          icon={FlaskConical}
          label="Тестов"
          value={String(summary.testCount)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Средний балл"
          value={summary.avgScore !== null ? `${summary.avgScore}%` : "—"}
          accent
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Выполнено"
          value={`${summary.completionRate}%`}
          hint="доля сданных работ"
        />
        <SummaryCard
          icon={Activity}
          label="За неделю"
          value={String(summary.weeklySubmissions)}
          hint="сдач"
        />
      </div>

      {summary.inactiveCount > 0 && summary.workCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
          <UserX className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-yellow-400">
              {summary.inactiveCount} {studentWord(summary.inactiveCount)}
            </span>{" "}
            ещё не сдавали работы или давно не были активны (14+ дней).
          </p>
        </div>
      )}

      {students.length > 0 && summary.workCount > 0 && (
        <StatsCollapsibleSection
          title="Сводка по ученикам"
          icon={Users}
          count={students.length}
          preview={studentSummaryPreview}
          defaultOpen={false}
          className="mb-4"
        >
          <p className="mb-3 px-1 text-xs text-text-muted">
            Общий прогресс каждого ученика по всем заданиям и тестам группы.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-2.5">Ученик</th>
                  <th className="px-4 py-2.5">Средний %</th>
                  <th className="px-4 py-2.5">Сдано</th>
                  <th className="px-4 py-2.5">Прогресс</th>
                  <th className="px-4 py-2.5">Последняя активность</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <StudentSummaryRow key={student.id} student={student} />
                ))}
              </tbody>
            </table>
          </div>
        </StatsCollapsibleSection>
      )}

      {assignments.length > 0 && (
        <StatsCollapsibleSection
          title="Задания"
          icon={ClipboardList}
          count={assignments.length}
          preview={workSectionPreview(assignments, students.length)}
          defaultOpen={false}
          className="mb-4"
        >
          <WorkResultsList
            workItems={assignments}
            students={students}
            getCell={(student, id) => student.assignmentCells[id]}
          />
        </StatsCollapsibleSection>
      )}

      {tests.length > 0 && (
        <StatsCollapsibleSection
          title="Тесты"
          icon={FlaskConical}
          count={tests.length}
          preview={workSectionPreview(tests, students.length)}
          defaultOpen={false}
          className="mb-4"
        >
          <WorkResultsList
            workItems={tests}
            students={students}
            getCell={(student, id) => student.testCells[id]}
          />
        </StatsCollapsibleSection>
      )}

      {summary.workCount === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-12 text-center">
          <p className="text-sm text-text-secondary">
            Нет опубликованных заданий и тестов
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={`/dashboard/group/${group.id}/assignments`}
              className="text-sm text-accent hover:underline"
            >
              Задания группы →
            </Link>
            <Link href="/tests" className="text-sm text-accent hover:underline">
              Тесты →
            </Link>
          </div>
        </div>
      )}

      {summary.workCount > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href={`/dashboard/group/${group.id}/assignments`}
            className="text-sm text-accent hover:underline"
          >
            Управление заданиями →
          </Link>
          <Link href="/tests" className="text-sm text-accent hover:underline">
            Управление тестами →
          </Link>
          <Link
            href={`/dashboard/group/${group.id}/students`}
            className="text-sm text-accent hover:underline"
          >
            Список учеников →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatsCollapsibleSection({
  title,
  icon: Icon,
  count,
  preview,
  defaultOpen = false,
  className,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  preview?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-bg-card",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-elevated/40 sm:px-5"
      >
        <ChevronDown
          className={chevronClass(open, "mt-0.5 h-4 w-4 shrink-0 text-text-muted")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold">{title}</h2>
            <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
              {count}
            </span>
          </div>
          {preview && !open && (
            <p className="mt-1.5 text-sm text-text-muted">{preview}</p>
          )}
        </div>
      </button>
      <Collapsible open={open}>
        <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {children}
        </div>
      </Collapsible>
    </section>
  );
}

function WorkResultsList({
  workItems,
  students,
  getCell,
}: {
  workItems: GroupWorkStats[];
  students: GroupStudentStats[];
  getCell: (student: GroupStudentStats, workId: string) => GroupStatsCell;
}) {
  return (
    <div className="space-y-2">
      {workItems.map((work, index) => (
        <WorkItemCard
          key={work.id}
          work={work}
          students={students}
          getCell={getCell}
          defaultOpen={index === 0 && workItems.length === 1}
        />
      ))}
    </div>
  );
}

function WorkItemCard({
  work,
  students,
  getCell,
  defaultOpen = false,
}: {
  work: GroupWorkStats;
  students: GroupStudentStats[];
  getCell: (student: GroupStudentStats, workId: string) => GroupStatsCell;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const submittedCount = students.filter((s) => getCell(s, work.id)).length;
  const preview = [
    work.categoryLabel,
    `${submittedCount}/${students.length} сдали`,
    work.avgScore !== null ? `среднее ${work.avgScore}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-bg-elevated/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50"
      >
        <ChevronDown
          className={chevronClass(open, "mt-0.5 h-4 w-4 shrink-0 text-text-muted")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <WorkKindBadge kind={work.kind} />
            <Link
              href={work.href}
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:text-accent"
            >
              {work.title}
            </Link>
          </div>
          <p className="mt-1 text-xs text-text-muted">{preview}</p>
        </div>
        {work.avgScore !== null && (
          <span
            className={cn(
              "shrink-0 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums",
              scoreColor(work.avgScore),
              "bg-bg-card"
            )}
          >
            {work.avgScore}%
          </span>
        )}
      </button>

      <Collapsible open={open}>
        <div className="border-t border-border/80 px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 font-medium">Ученик</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Баллы</th>
                  <th className="px-3 py-2 font-medium">Процент</th>
                  <th className="px-3 py-2 font-medium">Попытка</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const cell = getCell(student, work.id);
                  return (
                    <tr
                      key={student.id}
                      className="border-t border-border/40 hover:bg-bg-elevated/30"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium">
                        {student.fullName}
                      </td>
                      <td className="px-3 py-2.5">
                        <SubmissionStatus cell={cell} />
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-text-secondary">
                        {cell ? (
                          <>
                            {cell.score}{" "}
                            <span className="text-text-muted">из {cell.maxScore}</span>
                          </>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums">
                        {cell ? (
                          <span className={scoreColor(cell.pct)}>{cell.pct}%</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-text-muted">
                        {cell ? `№${cell.attemptNumber}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg-elevated/30 text-sm">
                  <td className="px-3 py-2.5 font-medium text-text-muted" colSpan={2}>
                    Среднее по работе
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">—</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {work.avgScore !== null ? (
                      <span className={cn("font-semibold", scoreColor(work.avgScore))}>
                        {work.avgScore}%
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-muted">
                    {submittedCount}/{students.length} сдали
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

function WorkKindBadge({ kind }: { kind: GroupWorkStats["kind"] }) {
  if (kind === "test") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-teal-400/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-400">
        <FlaskConical className="h-3 w-3" />
        Тест
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
      <ClipboardList className="h-3 w-3" />
      Задание
    </span>
  );
}

function SubmissionStatus({ cell }: { cell: GroupStatsCell }) {
  if (!cell) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
        <Minus className="h-3 w-3" />
        Не сдано
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-400">
      <Check className="h-3 w-3" />
      Сдано
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={cn(
          "text-xl font-bold tabular-nums",
          accent ? "text-accent" : "text-text-primary"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-text-muted">{hint}</p>}
    </div>
  );
}

function StudentSummaryRow({ student }: { student: GroupStudentStats }) {
  const progress =
    student.totalWork > 0
      ? Math.round((student.completedCount / student.totalWork) * 100)
      : 0;

  const notStarted = student.completedCount === 0 && student.totalWork > 0;

  return (
    <tr className="border-b border-border/50 last:border-b-0 hover:bg-bg-elevated/30">
      <td className="px-4 py-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          {student.fullName}
          {notStarted && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
              не сдавал
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums">
        {student.avgScore !== null ? (
          <span className={scoreColor(student.avgScore)}>{student.avgScore}%</span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
        {student.completedCount}{" "}
        <span className="text-text-muted">из {student.totalWork}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-elevated sm:w-24">
            <div
              className={cn("h-full rounded-full", scoreBg(progress))}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-text-muted">{progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {student.lastActivity ? formatDateTime(student.lastActivity) : "—"}
      </td>
    </tr>
  );
}

function workSectionPreview(items: GroupWorkStats[], studentCount: number) {
  if (items.length === 0) return undefined;

  const parts = items.slice(0, 2).map((item) => {
    const avg = item.avgScore !== null ? ` ~${item.avgScore}%` : "";
    return `${item.title} (${item.completedCount}/${studentCount}${avg})`;
  });

  if (items.length > 2) {
    parts.push(`ещё ${items.length - 2}`);
  }

  return parts.join(" · ");
}

function studentWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "ученик";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "ученика";
  return "учеников";
}
