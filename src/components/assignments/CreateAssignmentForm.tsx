"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Trash2, Shuffle, Users } from "lucide-react";
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
import { CheckboxCard, CheckboxOption } from "@/components/ui/Checkbox";
import {
  ExcelQuestionsImport,
  QuestionSourceTabs,
  type QuestionSourceMode,
} from "@/components/questions/ExcelQuestionsImport";
import { MultipleChoiceCorrectPicker } from "@/components/questions/MultipleChoiceCorrectPicker";
import { cn } from "@/lib/utils";
import {
  choiceChipClass,
  fieldInputClass,
  fieldInputCompactClass,
  fieldSelectClass,
  fieldSelectCompactClass,
} from "@/lib/form-styles";

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

export function CreateAssignmentForm({
  groups,
  preselectedGroupId,
}: {
  groups: GroupOption[];
  preselectedGroupId: string;
}) {
  const [mode, setMode] = useState<QuestionSourceMode>("template");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([preselectedGroupId]);
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
      else if (result?.createdCount && result.createdCount > 1) {
        router.push("/tasks");
      } else if (result?.assignmentId) {
        const targetGroupId = selectedGroupIds[0];
        router.push(`/dashboard/group/${targetGroupId}/assignments/${result.assignmentId}`);
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
        href="/tasks"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к заданиям
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Новое задание</h1>
      <p className="mb-6 text-text-secondary">
        Можно сразу назначить задание одной или нескольким группам
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
            placeholder="Орфография — тренировка 1"
            className={fieldInputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Категория</label>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldSelectClass}
          >
            {RESULT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Описание</label>
          <textarea name="description" rows={2} className={cn(fieldInputClass, "rounded-xl px-4 py-3")} />
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
                description="Ученик сможет решить заново"
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
                      className={choiceChipClass(effectiveTemplateCount === count, count > bankSize)}
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
                    className={cn(fieldInputCompactClass, "w-24")}
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
                      className={fieldSelectCompactClass}
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
                    placeholder={q.type === "gap_fill" ? "Правильная буква (напр. «е»)" : "Правильный ответ"}
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
              ? `Создать задание для ${selectedGroupIds.length} групп`
              : "Создать задание"}
        </button>
      </form>
    </div>
  );
}
