"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { saveAttemptDraft, submitAttempt } from "@/lib/assignment-actions";
import { cn, formatDateTime } from "@/lib/utils";
import { questionTypeLabel } from "@/lib/scoring";
import { getChoiceOptions } from "@/lib/question-options";
import { TakeFormProgress } from "@/components/assignments/TakeFormProgress";

type Question = {
  id: string;
  orderIndex: number;
  type: string;
  prompt: string;
  answerOptions?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

function parseDraftAnswers(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* ignore invalid draft */
  }
  return {};
}

export function TakeAssignmentForm({
  assignment,
  studentId,
  attemptId,
  attemptNumber,
  draftAnswers = "{}",
  dueAt = null,
  allowRetake = false,
}: {
  assignment: Assignment;
  studentId: string;
  attemptId: string;
  attemptNumber?: number;
  draftAnswers?: string;
  dueAt?: Date | null;
  allowRetake?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    parseDraftAnswers(draftAnswers)
  );
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [phase, setPhase] = useState<"idle" | "submitting" | "redirecting">("idle");
  const skipSave = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const isOverdue = !!dueAt && new Date() > new Date(dueAt);
  const submitBlocked = isOverdue && !allowRetake;

  const answeredCount = useMemo(
    () =>
      assignment.questions.filter((q) => {
        const a = answers[q.id];
        return a !== undefined && a.trim() !== "";
      }).length,
    [answers, assignment.questions]
  );

  const currentQuestion = useMemo(() => {
    const idx = assignment.questions.findIndex((q) => {
      const a = answers[q.id];
      return !a || a.trim() === "";
    });
    return idx === -1 ? assignment.questions.length : idx + 1;
  }, [answers, assignment.questions]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const result = await saveAttemptDraft(attemptId, answers);
      if (result?.success) setSaveStatus("saved");
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [answers, attemptId]);

  const allAnswered = assignment.questions.every((q) => {
    const a = answers[q.id];
    return a !== undefined && a.trim() !== "";
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitBlocked) {
      setError("Срок сдачи истёк. Пересдача не разрешена.");
      return;
    }
    if (!allAnswered) {
      setError("Ответьте на все вопросы");
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const formData = new FormData();
    formData.set("assignmentId", assignment.id);
    formData.set("studentId", studentId);
    formData.set("attemptId", attemptId);
    assignment.questions.forEach((q) => {
      formData.set(`answer_${q.id}`, answers[q.id]);
    });

    setError(null);
    setPhase("submitting");

    try {
      const result = await submitAttempt(formData);
      if (result?.error) {
        setError(result.error);
        setPhase("idle");
        return;
      }
      setPhase("redirecting");
      router.push(`/tasks/${assignment.id}/result?attempt=${result?.attemptId ?? attemptId}`);
    } catch {
      setError("Не удалось отправить задание. Попробуйте ещё раз.");
      setPhase("idle");
    }
  }

  const mcOptions = (q: Question) => getChoiceOptions(q);

  return (
    <div>
      <Link href="/tasks" className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent">
        <ArrowLeft className="h-4 w-4" />
        К заданиям
      </Link>

      <h1 className="mb-2 text-2xl font-bold">{assignment.title}</h1>
      {attemptNumber && attemptNumber > 1 && (
        <p className="mb-2 text-sm text-accent">Попытка #{attemptNumber}</p>
      )}
      {assignment.description && (
        <p className="mb-6 text-text-secondary">{assignment.description}</p>
      )}

      {isOverdue && (
        <div
          className={cn(
            "mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            submitBlocked
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
          )}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {submitBlocked
              ? `Срок сдачи истёк (${formatDateTime(dueAt!)}). Пересдача не разрешена.`
              : `Срок сдачи прошёл (${formatDateTime(dueAt!)}). Вы всё ещё можете сдать работу.`}
          </p>
        </div>
      )}

      <TakeFormProgress
        currentQuestion={currentQuestion}
        answeredCount={answeredCount}
        totalCount={assignment.questions.length}
        saveStatus={saveStatus}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {assignment.questions.map((q, i) => (
          <fieldset key={q.id} className="rounded-2xl border border-border bg-bg-card p-5">
            <legend className="mb-1 text-sm font-medium">
              <span className="mr-2 text-accent">#{i + 1}</span>
              {q.prompt}
            </legend>
            <p className="mb-4 text-xs text-text-muted">{questionTypeLabel(q.type)}</p>

            {q.type === "multiple_choice" ? (
              <div className="space-y-2">
                {mcOptions(q).map(({ key, text }) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                      answers[q.id] === key
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg-elevated hover:border-accent/30"
                    )}
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={key}
                      checked={answers[q.id] === key}
                      onChange={() => setAnswers((p) => ({ ...p, [q.id]: key }))}
                      className="accent-accent"
                    />
                    <span className="font-medium text-accent">{key}.</span>
                    {text}
                  </label>
                ))}
              </div>
            ) : q.type === "gap_fill" ? (
              <input
                type="text"
                maxLength={5}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                placeholder="Введите букву"
                className="w-24 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-center text-lg font-medium uppercase outline-none focus:border-accent"
              />
            ) : (
              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                placeholder="Введите ответ"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
              />
            )}
          </fieldset>
        ))}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={phase !== "idle" || !allAnswered || submitBlocked}
          className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {phase === "submitting"
            ? "Отправка..."
            : phase === "redirecting"
              ? "Открываем результат..."
              : "Сдать задание"}
        </button>
      </form>
    </div>
  );
}
