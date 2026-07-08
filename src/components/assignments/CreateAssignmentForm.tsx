"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Shuffle } from "lucide-react";
import { createAssignment } from "@/lib/assignment-actions";
import { RESULT_CATEGORIES } from "@/lib/utils";
import { QUESTION_TYPES } from "@/lib/scoring";
import { DateInput } from "@/components/ui/DateInput";
import { CheckboxCard } from "@/components/ui/Checkbox";
import {
  ExcelQuestionsImport,
  QuestionSourceTabs,
  type QuestionSourceMode,
} from "@/components/questions/ExcelQuestionsImport";

const emptyQuestion = {
  type: "multiple_choice",
  prompt: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
};

export function CreateAssignmentForm({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [mode, setMode] = useState<QuestionSourceMode>("template");
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("groupId", groupId);

    if (mode === "template") {
      formData.set("useTemplate", "on");
    } else if (mode === "manual") {
      questions.forEach((q, i) => {
        Object.entries(q).forEach(([key, val]) => {
          formData.set(`questions[${i}].${key}`, val);
        });
      });
    } else if (mode === "excel") {
      const file = formData.get("excelFile") as File | null;
      if (!file || file.size === 0) {
        setError("Сначала загрузите файл Excel с вопросами");
        return;
      }
    }

    startTransition(async () => {
      const result = await createAssignment(formData);
      if (result?.error) setError(result.error);
      else if (result?.assignmentId) {
        router.push(`/dashboard/group/${groupId}/assignments/${result.assignmentId}`);
      }
    });
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <Link
        href={`/dashboard/group/${groupId}/assignments`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к заданиям
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Новое задание</h1>
      <p className="mb-6 text-text-secondary">{groupName}</p>

      <form action={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Название</label>
          <input
            name="title"
            required
            placeholder="Орфография — тренировка 1"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Категория</label>
          <select
            name="category"
            required
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          >
            {RESULT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Описание</label>
          <textarea name="description" rows={2} className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Срок</label>
            <DateInput name="dueAt" />
          </div>
          <CheckboxCard
            name="allowRetake"
            title="Разрешить пересдачу"
            description="Ученик сможет решить заново"
          />
          <CheckboxCard
            name="shuffleQuestions"
            title={
              <span className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-accent" />
                Перемешать вопросы
              </span>
            }
            description="У каждого ученика — случайный порядок"
          />
        </div>

        <QuestionSourceTabs
          mode={mode}
          onChange={setMode}
          templateLabel="Готовые"
          templateHint="Подставятся 3 случайных вопроса из банка по выбранной категории."
        />

        {mode === "excel" && <ExcelQuestionsImport disabled={pending} />}

        {mode === "manual" && (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">Вопрос {idx + 1}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const next = [...questions];
                        next[idx].type = e.target.value;
                        setQuestions(next);
                      }}
                      className="rounded-lg border border-border bg-bg-elevated px-2 py-1 text-xs"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-400"
                        title="Убрать вопрос"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  value={q.prompt}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx].prompt = e.target.value;
                    setQuestions(next);
                  }}
                  placeholder="Текст вопроса"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                />
                {q.type === "multiple_choice" && (
                  <>
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <input
                        key={letter}
                        value={q[`option${letter}`]}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx][`option${letter}`] = e.target.value;
                          setQuestions(next);
                        }}
                        placeholder={`Вариант ${letter}`}
                        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                      />
                    ))}
                    <select
                      value={q.correctOption}
                      onChange={(e) => {
                        const next = [...questions];
                        next[idx].correctOption = e.target.value;
                        setQuestions(next);
                      }}
                      className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                    >
                      {["A", "B", "C", "D"].map((l) => (
                        <option key={l} value={l}>Правильный: {l}</option>
                      ))}
                    </select>
                  </>
                )}
                {q.type !== "multiple_choice" && (
                  <input
                    value={q.correctOption}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx].correctOption = e.target.value;
                      setQuestions(next);
                    }}
                    placeholder={q.type === "gap_fill" ? "Правильная буква (напр. «е»)" : "Правильный ответ"}
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                  />
                )}
                <input
                  value={q.explanation}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx].explanation = e.target.value;
                    setQuestions(next);
                  }}
                  placeholder="Пояснение (необязательно)"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestions([...questions, { ...emptyQuestion }])}
              className="text-sm text-accent hover:underline"
            >
              + Добавить вопрос
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Создание..." : "Создать задание"}
        </button>
      </form>
    </div>
  );
}
