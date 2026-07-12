"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Shuffle, Users } from "lucide-react";
import { createTest } from "@/lib/test-actions";
import { QUESTION_TYPES } from "@/lib/scoring";
import { DateInput } from "@/components/ui/DateInput";
import { CheckboxCard, CheckboxOption } from "@/components/ui/Checkbox";
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

type GroupOption = {
  id: string;
  name: string;
};

export function CreateTestForm({
  groups,
  preselectedGroupId,
}: {
  groups: GroupOption[];
  preselectedGroupId: string;
}) {
  const [mode, setMode] = useState<QuestionSourceMode>("template");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([preselectedGroupId]);
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => {
      if (current.includes(groupId)) {
        if (current.length === 1) return current;
        return current.filter((id) => id !== groupId);
      }
      return [...current, groupId];
    });
  }

  function selectAllGroups() {
    setSelectedGroupIds(groups.map((group) => group.id));
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    if (selectedGroupIds.length === 0) {
      setError("Выберите хотя бы одну группу");
      return;
    }

    selectedGroupIds.forEach((groupId) => {
      formData.append("groupIds", groupId);
    });

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
      const result = await createTest(formData);
      if (result?.error) setError(result.error);
      else if (result?.createdCount && result.createdCount > 1) {
        router.push("/tests");
      } else if (result?.testId) {
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
        href="/tests"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к тестам
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Новый тест</h1>
      <p className="mb-6 text-text-secondary">
        Можно сразу назначить тест одной или нескольким группам
      </p>

      <form action={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm text-text-secondary">Группы</label>
            {groups.length > 1 && (
              <button
                type="button"
                onClick={selectAllGroups}
                className="text-xs text-accent hover:underline"
              >
                Выбрать все
              </button>
            )}
          </div>
          <div className="space-y-2 rounded-xl border border-border/80 bg-bg-card/80 p-3">
            {groups.map((group) => {
              const selected = selectedGroupIds.includes(group.id);
              return (
                <CheckboxOption
                  key={group.id}
                  checked={selected}
                  onChange={() => toggleGroup(group.id)}
                >
                  <Users className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm font-medium">{group.name}</span>
                </CheckboxOption>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            Выбрано групп: {selectedGroupIds.length}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Название</label>
          <input
            name="title"
            required
            placeholder="Пробный вариант ЕГЭ №1"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Описание</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Полный вариант по заданиям 4–27"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Срок</label>
            <DateInput name="dueAt" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
            <CheckboxCard
              name="allowRetake"
              title="Разрешить пересдачу"
              description="Ученик сможет пройти заново"
            />
            <CheckboxCard
              name="shuffleQuestions"
              title={
                <span className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-accent" />
                  Перемешать вопросы
                </span>
              }
              description="У каждого ученика вопросы будут в случайном порядке"
            />
          </div>
        </div>

        <QuestionSourceTabs
          mode={mode}
          onChange={setMode}
          templateLabel="Вариант ЕГЭ"
          templateHint="Подставится случайный пробный вариант из 10 загруженных (по 12 вопросов)."
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
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending
            ? "Создание..."
            : selectedGroupIds.length > 1
              ? `Создать тест для ${selectedGroupIds.length} групп`
              : "Создать тест"}
        </button>
      </form>
    </div>
  );
}
