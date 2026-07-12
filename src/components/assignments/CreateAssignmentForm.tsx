"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Trash2, Shuffle } from "lucide-react";
import { createAssignment } from "@/lib/assignment-actions";
import { RESULT_CATEGORIES } from "@/lib/utils";
import { QUESTION_TYPES } from "@/lib/scoring";
import {
  DEFAULT_TEMPLATE_COUNT,
  getTemplateBankSize,
  MAX_TEMPLATE_COUNT,
  TEMPLATE_COUNT_PRESETS,
} from "@/lib/question-templates";
import { DateInput } from "@/components/ui/DateInput";
import { CheckboxCard } from "@/components/ui/Checkbox";
import {
  ExcelQuestionsImport,
  QuestionSourceTabs,
  type QuestionSourceMode,
} from "@/components/questions/ExcelQuestionsImport";
import { cn } from "@/lib/utils";

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
  const [category, setCategory] = useState<string>(RESULT_CATEGORIES[0].id);
  const [templateCount, setTemplateCount] = useState(DEFAULT_TEMPLATE_COUNT);
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const bankSize = useMemo(() => getTemplateBankSize(category), [category]);
  const effectiveTemplateCount = Math.min(templateCount, bankSize, MAX_TEMPLATE_COUNT);

  function handleTemplateCountChange(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    setTemplateCount(Math.min(Math.max(parsed, 1), MAX_TEMPLATE_COUNT));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("groupId", groupId);

    if (mode === "template") {
      formData.set("useTemplate", "on");
      formData.set("templateCount", String(effectiveTemplateCount));
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
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

        <section className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Параметры</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Срок сдачи</p>
                  <p className="text-xs text-text-muted">Необязательно</p>
                </div>
              </div>
              <DateInput name="dueAt" />
            </div>

            <CheckboxCard
              name="allowRetake"
              className="h-full min-w-0"
              title="Разрешить пересдачу"
              description="Ученик сможет решить заново"
            />

            <CheckboxCard
              name="shuffleQuestions"
              className="h-full min-w-0"
              title={
                <span className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-accent" />
                  Перемешать вопросы
                </span>
              }
              description="У каждого ученика — случайный порядок"
            />
          </div>
        </section>

        <QuestionSourceTabs
          mode={mode}
          onChange={setMode}
          templateLabel="Готовые"
          templateContent={
            <div className="space-y-4">
              <p>
                Случайные вопросы из банка по выбранной категории. В банке сейчас{" "}
                <span className="font-medium text-text-primary">{bankSize}</span>{" "}
                {bankSize === 1 ? "вопрос" : bankSize < 5 ? "вопроса" : "вопросов"}.
              </p>

              <div>
                <p className="mb-2 text-sm font-medium text-text-primary">
                  Сколько вопросов сгенерировать
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_COUNT_PRESETS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      disabled={count > bankSize}
                      onClick={() => setTemplateCount(count)}
                      className={cn(
                        "rounded-lg border px-3.5 py-2 text-sm font-medium transition-all",
                        effectiveTemplateCount === count
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-text-secondary hover:border-accent/30",
                        count > bankSize && "cursor-not-allowed opacity-40"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-text-secondary" htmlFor="templateCount">
                    Другое число
                  </label>
                  <input
                    id="templateCount"
                    type="number"
                    min={1}
                    max={Math.min(bankSize, MAX_TEMPLATE_COUNT)}
                    value={templateCount}
                    onChange={(e) => handleTemplateCountChange(e.target.value)}
                    className="w-24 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                {templateCount > bankSize && (
                  <p className="mt-2 text-xs text-amber-300">
                    В банке только {bankSize} — будет подставлено {bankSize}{" "}
                    {bankSize === 1 ? "вопрос" : bankSize < 5 ? "вопроса" : "вопросов"}.
                  </p>
                )}
                <p className="mt-2 text-xs text-text-muted">
                  Будет создано: {effectiveTemplateCount}{" "}
                  {effectiveTemplateCount === 1
                    ? "вопрос"
                    : effectiveTemplateCount < 5
                      ? "вопроса"
                      : "вопросов"}
                </p>
              </div>
            </div>
          }
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
