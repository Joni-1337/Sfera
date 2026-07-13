"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Shuffle, Users, CalendarDays } from "lucide-react";
import { createTest } from "@/lib/test-actions";
import { QUESTION_TYPES } from "@/lib/scoring";
import { DateInput } from "@/components/ui/DateInput";
import { CheckboxCard, CheckboxOption } from "@/components/ui/Checkbox";
import {
  ExcelQuestionsImport,
  QuestionSourceTabs,
  type QuestionSourceMode,
} from "@/components/questions/ExcelQuestionsImport";
import { MultipleChoiceCorrectPicker } from "@/components/questions/MultipleChoiceCorrectPicker";
import {
  fieldInputClass,
  fieldSelectCompactClass,
} from "@/lib/form-styles";
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
            className={cn(fieldInputClass, "rounded-xl px-4 py-3")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Описание</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Полный вариант по заданиям 4–27"
            className={cn(fieldInputClass, "rounded-xl px-4 py-3")}
          />
        </div>

        <section className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Параметры</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <div className="h-full rounded-xl border border-border bg-bg-elevated/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Срок сдачи</p>
                    <p className="text-xs text-text-muted">Необязательно</p>
                  </div>
                </div>
                <DateInput name="dueAt" />
              </div>
            </div>

            <div className="min-w-0">
              <CheckboxCard
                name="allowRetake"
                className="h-full"
                title="Разрешить пересдачу"
                description="Ученик сможет пройти заново"
              />
            </div>

            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <CheckboxCard
                name="shuffleQuestions"
                className="h-full"
                title={
                  <span className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-accent" />
                    Перемешать вопросы
                  </span>
                }
                description="У каждого ученика — случайный порядок"
              />
            </div>
          </div>
        </section>

        <QuestionSourceTabs
          mode={mode}
          onChange={setMode}
          templateLabel="Вариант ЕГЭ"
          templateHint="Подставится случайный полный вариант ЕГЭ."
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
                      className={fieldSelectCompactClass}
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
                  className={fieldInputClass}
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
                        className={fieldInputClass}
                      />
                    ))}
                    <MultipleChoiceCorrectPicker
                      value={q.correctOption}
                      onChange={(correctOption) => {
                        const next = [...questions];
                        next[idx].correctOption = correctOption;
                        setQuestions(next);
                      }}
                    />
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
                    className={fieldInputClass}
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
                  className={fieldInputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestions([...questions, { ...emptyQuestion }])}
              className="text-sm text-teal-200 hover:text-teal-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 rounded px-1"
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
