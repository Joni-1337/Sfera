"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Pencil, Copy, ChevronDown } from "lucide-react";
import { publishAssignment, unpublishAssignment, updateAssignmentSettings, duplicateAssignment } from "@/lib/assignment-actions";
import {
  bestAttemptForStudent,
  countCompletedAttempts,
  getStudentAttempts,
} from "@/lib/attempts";
import { formatDateTime, RESULT_CATEGORIES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CheckboxRow } from "@/components/ui/Checkbox";
import { QuestionReviewAccordionList } from "@/components/assignments/QuestionReviewAccordionList";
import {
  QuestionReviewCard,
  errorRateBadgeClass,
  type QuestionReviewData,
} from "@/components/assignments/QuestionReviewCard";
import { Collapsible, chevronClass } from "@/components/ui/Collapsible";

type Question = QuestionReviewData;

type Answer = {
  questionId: string;
  chosenOption: string;
  isCorrect: boolean;
  question: Question;
};

type Attempt = {
  id: string;
  status: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  completedAt: Date | null;
  student: { id: string; fullName: string };
  answers: Answer[];
};

type Assignment = {
  id: string;
  title: string;
  category: string;
  description: string;
  published: boolean;
  allowRetake: boolean;
  dueAt: Date | null;
  questions: Question[];
  attempts: Attempt[];
  group: { id: string; name: string; students: { id: string; fullName: string }[] };
};

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function AssignmentStatsView({ assignment }: { assignment: Assignment }) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const bestAttempts = assignment.group.students
    .map((s) => bestAttemptForStudent(assignment.attempts, s.id))
    .filter(Boolean) as Attempt[];

  const completedAttempts = bestAttempts.filter((a) => a.status === "completed");

  const totalAttemptsCount = assignment.attempts.length;

  const questionStats = assignment.questions.map((q) => {
    const wrong = completedAttempts.filter((a) =>
      a.answers.some((ans) => ans.questionId === q.id && !ans.isCorrect)
    ).length;
    const total = completedAttempts.length;
    return { question: q, wrong, total, pct: total ? Math.round((wrong / total) * 100) : 0 };
  });

  function togglePublish() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("assignmentId", assignment.id);
      if (assignment.published) {
        await unpublishAssignment(fd);
      } else {
        await publishAssignment(fd);
      }
      router.refresh();
    });
  }

  function handleDuplicate() {
    setActionError(null);
    startTransition(async () => {
      const result = await duplicateAssignment(assignment.id);
      if (result?.error) {
        setActionError(result.error);
        return;
      }
      if (result?.assignmentId) {
        router.push(
          `/dashboard/group/${assignment.group.id}/assignments/${result.assignmentId}`
        );
      }
    });
  }

  const studentRows = assignment.group.students.map((student) => ({
    student,
    attempt: bestAttemptForStudent(assignment.attempts, student.id),
    allAttempts: getStudentAttempts(assignment.attempts, student.id),
    completedCount: countCompletedAttempts(assignment.attempts, student.id),
  }));

  function toggleRetake(formData: FormData) {
    startTransition(async () => {
      await updateAssignmentSettings(formData);
      router.refresh();
    });
  }

  return (
    <div>
      <Link
        href={`/dashboard/group/${assignment.group.id}/assignments`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к заданиям
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-text-secondary">
            {assignment.group.name} · {categoryLabel(assignment.category)}
          </p>
          {assignment.description && (
            <p className="mt-2 text-sm text-text-muted">{assignment.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Дублировать
          </button>
          {!assignment.published && (
            <Link
              href={`/dashboard/group/${assignment.group.id}/assignments/${assignment.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </Link>
          )}
          <button
            onClick={togglePublish}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
              assignment.published
                ? "border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                : "bg-accent text-white hover:bg-accent-hover"
            )}
          >
            {assignment.published ? (
              <>
                <EyeOff className="h-4 w-4" /> Снять с публикации
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Опубликовать для учеников
              </>
            )}
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {actionError}
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Вопросов" value={String(assignment.questions.length)} />
        <StatCard
          label="Выполнили"
          value={`${completedAttempts.length} / ${assignment.group.students.length}`}
        />
        <StatCard label="Всего попыток" value={String(totalAttemptsCount)} />
        <StatCard
          label="Средний балл"
          value={
            completedAttempts.length
              ? `${Math.round(
                  (completedAttempts.reduce((s, a) => s + a.score, 0) /
                    completedAttempts.length /
                    assignment.questions.length) *
                    100
                )}%`
              : "—"
          }
        />
      </div>

      <form action={toggleRetake} className="mb-8 rounded-xl border border-border/80 bg-bg-card p-4">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <CheckboxRow
          name="allowRetake"
          defaultChecked={assignment.allowRetake}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          title="Разрешить пересдачу"
          description="Ученики смогут проходить задание повторно"
        />
      </form>

      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-bg-card">
        <button
          type="button"
          onClick={() => setContentOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-bg-elevated/30"
        >
          <div>
            <h2 className="text-lg font-semibold">Содержание задания</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              {assignment.questions.length}{" "}
              {assignment.questions.length === 1
                ? "вопрос"
                : assignment.questions.length < 5
                  ? "вопроса"
                  : "вопросов"}
              {" · "}
              нажмите, чтобы {contentOpen ? "скрыть" : "открыть"}
            </p>
          </div>
          <ChevronDown
            className={chevronClass(contentOpen, "h-5 w-5 shrink-0 text-text-secondary")}
          />
        </button>

        <Collapsible open={contentOpen}>
          <div className="border-t border-border px-5 pb-5 pt-4">
            <p className="mb-4 text-sm text-text-secondary">
              Так ученики видят вопросы, варианты ответов и пояснения после проверки.
            </p>
            <QuestionReviewAccordionList questions={assignment.questions} />
          </div>
        </Collapsible>
      </section>

      {assignment.published && completedAttempts.length > 0 && (
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Где чаще всего ошибаются</h2>
        <div className="space-y-3">
          {questionStats.map(({ question, wrong, total, pct }, i) => (
            <div
              key={question.id}
              className="rounded-xl border border-border bg-bg-card p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <p className="text-sm text-text-primary">
                  <span className="font-semibold text-teal-200">#{i + 1} </span>
                  {question.prompt}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs",
                    errorRateBadgeClass(pct)
                  )}
                >
                  {total ? `${wrong}/${total} ошибок` : "—"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct > 50 ? "bg-red-400" : pct > 0 ? "bg-amber-400" : "bg-teal-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {pct > 0 && (
                <div className="mt-4">
                  <QuestionReviewCard question={question} index={i} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Результаты учеников</h2>

        {/* Mobile: cards */}
        <div className="space-y-3 md:hidden">
          {studentRows.map(({ student, attempt, allAttempts, completedCount }) => {
            const wrongAnswers = attempt?.answers.filter((a) => !a.isCorrect) ?? [];
            const canExpand = allAttempts.length > 0;
            const expanded = expandedStudent === student.id;

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-border bg-bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-medium leading-snug">{student.fullName}</p>
                  {!attempt ? (
                    <span className="shrink-0 text-xs text-text-muted">Не начинал</span>
                  ) : attempt.status === "completed" ? (
                    <span className="badge-status-done shrink-0 rounded-full px-2.5 py-0.5 text-xs">
                      Выполнено
                    </span>
                  ) : (
                    <span className="badge-status-progress shrink-0 rounded-full px-2.5 py-0.5 text-xs">
                      В процессе
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-text-muted">Попытка</dt>
                    <dd className="mt-0.5">
                      {attempt ? (
                        <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          #{attempt.attemptNumber}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Балл</dt>
                    <dd className="mt-0.5 font-medium">
                      {attempt?.status === "completed"
                        ? `${attempt.score}/${attempt.maxScore}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Ошибки</dt>
                    <dd className="mt-0.5 font-medium text-red-400">
                      {wrongAnswers.length || "—"}
                    </dd>
                  </div>
                  {completedCount > 1 && (
                    <div>
                      <dt className="text-xs text-text-muted">Сдач</dt>
                      <dd className="mt-0.5 text-text-secondary">{completedCount}</dd>
                    </div>
                  )}
                </dl>

                {canExpand && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStudent(expanded ? null : student.id)
                      }
                      className="mt-3 text-sm text-accent hover:underline"
                    >
                      {expanded ? "Скрыть" : "Подробнее"}
                    </button>

                    <Collapsible open={expanded} scrollOnOpen>
                      <StudentAttemptDetails
                        studentName={student.fullName}
                        attempt={attempt}
                        allAttempts={allAttempts}
                        questions={assignment.questions}
                      />
                    </Collapsible>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-bg-card md:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Ученик</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3">Попытка</th>
                <th className="px-5 py-3">Балл</th>
                <th className="px-5 py-3">Ошибки</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map(({ student, attempt, allAttempts, completedCount }) => {
                const wrongAnswers =
                  attempt?.answers.filter((a) => !a.isCorrect) ?? [];
                const canExpand = allAttempts.length > 0;
                return (
                  <Fragment key={student.id}>
                    <tr className="border-b border-border/50 hover:bg-bg-elevated/30">
                      <td className="px-5 py-3.5 text-sm">{student.fullName}</td>
                      <td className="px-5 py-3.5">
                        {!attempt ? (
                          <span className="text-xs text-text-muted">Не начинал</span>
                        ) : attempt.status === "completed" ? (
                          <span className="badge-status-done rounded-full px-2.5 py-0.5 text-xs">
                            Выполнено
                          </span>
                        ) : (
                          <span className="badge-status-progress rounded-full px-2.5 py-0.5 text-xs">
                            В процессе
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {attempt ? (
                          <span className="inline-flex flex-col gap-0.5">
                            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                              Попытка #{attempt.attemptNumber}
                            </span>
                            {completedCount > 1 && (
                              <span className="text-[10px] text-text-muted">
                                лучший результат · {completedCount} сдач
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {attempt?.status === "completed"
                          ? `${attempt.score}/${attempt.maxScore}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-red-400">
                        {wrongAnswers.length || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {canExpand && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStudent(
                                expandedStudent === student.id ? null : student.id
                              )
                            }
                            className="text-xs text-accent hover:underline"
                          >
                            {expandedStudent === student.id ? "Скрыть" : "Подробнее"}
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-0">
                        <Collapsible open={expandedStudent === student.id} scrollOnOpen>
                          <div className="bg-bg-elevated/50 px-5 py-4">
                            <StudentAttemptDetails
                              studentName={student.fullName}
                              attempt={attempt}
                              allAttempts={allAttempts}
                              questions={assignment.questions}
                            />
                          </div>
                        </Collapsible>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function StudentAttemptDetails({
  studentName,
  attempt,
  allAttempts,
  questions,
}: {
  studentName: string;
  attempt: Attempt | undefined;
  allAttempts: Attempt[];
  questions: Question[];
}) {
  const answerByQuestionId = new Map(
    (attempt?.answers ?? []).map((answer) => [answer.questionId, answer])
  );

  return (
    <div className="mt-4 border-t border-border pt-4 md:mt-0 md:border-0 md:pt-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        История попыток — {studentName}
      </p>
      <ul className="mb-6 space-y-2">
        {allAttempts.map((at) => (
          <li
            key={at.id}
            className={cn(
              "flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
              at.id === attempt?.id
                ? "border-accent/30 bg-accent/5"
                : "border-border bg-bg-card"
            )}
          >
            <span>
              <span className="font-medium text-teal-200">Попытка #{at.attemptNumber}</span>
              {at.id === attempt?.id && (
                <span className="ml-2 text-xs text-text-secondary">(лучший)</span>
              )}
            </span>
            <span className="text-text-secondary">
              {at.status === "completed" ? (
                <>
                  {at.score}/{at.maxScore}
                  {at.completedAt && (
                    <span className="ml-2 text-xs text-text-muted">
                      · {formatDateTime(at.completedAt)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-amber-200">В процессе</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {attempt && (
        <>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Ответы ученика (лучшая попытка №{attempt.attemptNumber})
          </p>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const answer = answerByQuestionId.get(question.id);
              return (
                <QuestionReviewCard
                  key={question.id}
                  question={question}
                  index={index}
                  chosenOption={answer?.chosenOption ?? null}
                  compact
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
