"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Shuffle } from "lucide-react";
import { updateTest } from "@/lib/test-actions";
import { QUESTION_TYPES } from "@/lib/scoring";
import { DateInput, formatDateInputValue } from "@/components/ui/DateInput";
import { CheckboxCard } from "@/components/ui/Checkbox";

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

type QuestionData = {
  type: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

type TestData = {
  id: string;
  title: string;
  description: string;
  allowRetake: boolean;
  shuffleQuestions: boolean;
  dueAt: Date | null;
  questions: QuestionData[];
};

function toFormQuestion(q: QuestionData) {
  return {
    type: q.type,
    prompt: q.prompt,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
  };
}

function formatDateInput(date: Date | null) {
  return formatDateInputValue(date);
}

export function EditTestForm({
  groupName,
  test,
}: {
  groupName: string;
  test: TestData;
}) {
  const [questions, setQuestions] = useState(
    test.questions.length > 0
      ? test.questions.map(toFormQuestion)
      : [{ ...emptyQuestion }]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("testId", test.id);

    questions.forEach((q, i) => {
      Object.entries(q).forEach(([key, val]) => {
        formData.set(`questions[${i}].${key}`, val);
      });
    });

    startTransition(async () => {
      const result = await updateTest(formData);
      if (result?.error) setError(result.error);
      else if (result?.testId) {
        router.push(`/tests/${result.testId}`);
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
        href={`/tests/${test.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к тесту
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Редактирование теста</h1>
      <p className="mb-6 text-text-secondary">{groupName}</p>

      <form action={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Название</label>
          <input
            name="title"
            required
            defaultValue={test.title}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Описание</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={test.description}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Срок</label>
            <DateInput name="dueAt" defaultValue={formatDateInput(test.dueAt)} />
          </div>
          <CheckboxCard
            name="allowRetake"
            defaultChecked={test.allowRetake}
            title="Разрешить пересдачу"
            description="Ученик сможет пройти заново"
          />
          <CheckboxCard
            name="shuffleQuestions"
            defaultChecked={test.shuffleQuestions}
            title={
              <span className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-accent" />
                Перемешать вопросы
              </span>
            }
            description="У каждого ученика — случайный порядок"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Вопросы</h2>
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
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-400"
                      title="Удалить вопрос"
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
                      <option key={l} value={l}>
                        Правильный: {l}
                      </option>
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
                  placeholder="Правильный ответ"
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

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Сохранение..." : "Сохранить изменения"}
          </button>
          <Link
            href={`/tests/${test.id}`}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
