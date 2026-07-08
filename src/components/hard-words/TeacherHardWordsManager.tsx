"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  FileSpreadsheet,
} from "lucide-react";
import {
  createHardWord,
  updateHardWord,
  deleteHardWord,
} from "@/lib/hard-word-actions";
import { HARD_WORD_TOPICS, hardWordTopicLabel } from "@/lib/hard-word-constants";
import {
  filterWordsBySearch,
  getAvailableLetters,
  groupWordsByLetter,
  sortWords,
  type WordSort,
} from "@/lib/hard-words-utils";
import { HardWordsBulkImport } from "@/components/hard-words/HardWordsBulkImport";
import { cn } from "@/lib/utils";

type HardWord = {
  id: string;
  topic: string;
  word: string;
  definition: string;
  example: string;
};

export function TeacherHardWordsManager({
  words,
  initialTopic,
}: {
  words: HardWord[];
  initialTopic?: string;
}) {
  const [topicFilter, setTopicFilter] = useState(initialTopic ?? "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WordSort>("alpha-asc");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<HardWord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const byTopic =
      topicFilter === "all" ? words : words.filter((w) => w.topic === topicFilter);
    const bySearch = filterWordsBySearch(byTopic, search);
    return sortWords(bySearch, sort);
  }, [words, topicFilter, search, sort]);

  const letterGroups = useMemo(() => groupWordsByLetter(filtered), [filtered]);
  const availableLetters = useMemo(() => getAvailableLetters(filtered), [filtered]);

  function scrollToLetter(letter: string) {
    document.getElementById(`teacher-word-letter-${letter}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const topicCounts = HARD_WORD_TOPICS.map((t) => ({
    ...t,
    count: words.filter((w) => w.topic === t.id).length,
  }));

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createHardWord(formData);
      if (result?.error) setError(result.error);
      else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateHardWord(formData);
      if (result?.error) setError(result.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить слово из списка?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteHardWord(fd);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сложные слова</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Словарь для учеников — по темам ЕГЭ. Ученики видят слова и отмечают выученные.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowImport(true);
              setShowForm(false);
              setEditing(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Импорт из Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setShowImport(false);
              setEditing(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Добавить слово
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по слову, правилу или примеру..."
            className="w-full rounded-xl border border-border bg-bg-elevated py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setSort((current) => (current === "alpha-asc" ? "alpha-desc" : "alpha-asc"))
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-secondary hover:border-accent/30 hover:text-accent"
        >
          {sort === "alpha-asc" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ArrowUpAZ className="h-4 w-4" />
          )}
          {sort === "alpha-asc" ? "А → Я" : "Я → А"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <TopicChip
          active={topicFilter === "all"}
          onClick={() => setTopicFilter("all")}
          label={`Все (${words.length})`}
        />
        {topicCounts.map((t) => (
          <TopicChip
            key={t.id}
            active={topicFilter === t.id}
            onClick={() => setTopicFilter(t.id)}
            label={`${t.label} (${t.count})`}
          />
        ))}
      </div>

      {filtered.length > 0 && availableLetters.length > 1 && !search && (
        <div className="sticky top-16 z-10 mb-4 overflow-x-auto rounded-xl border border-border bg-bg-card/95 p-2 backdrop-blur">
          <div className="flex min-w-max gap-1">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {(showForm || editing) && (
        <WordForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          defaultTopic={topicFilter !== "all" ? topicFilter : HARD_WORD_TOPICS[0].id}
          pending={pending}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {showImport && (
        <HardWordsBulkImport
          onClose={() => {
            setShowImport(false);
          }}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            {search
              ? "Ничего не найдено — попробуйте другой запрос"
              : words.length === 0
                ? "Слов пока нет. Добавьте первое слово для учеников."
                : "В этой теме пока нет слов."}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Слово</th>
                <th className="px-5 py-3">Тема</th>
                <th className="px-5 py-3">Значение</th>
                <th className="w-24 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {letterGroups.map(({ letter, items }) => (
                <Fragment key={letter}>
                  <tr
                    key={`letter-${letter}`}
                    id={`teacher-word-letter-${letter}`}
                    className="scroll-mt-28 bg-bg-elevated/40"
                  >
                    <td colSpan={4} className="px-5 py-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
                        {letter}
                      </span>
                      <span className="ml-2 text-xs text-text-muted">
                        {items.length}{" "}
                        {items.length === 1 ? "слово" : items.length < 5 ? "слова" : "слов"}
                      </span>
                    </td>
                  </tr>
                  {items.map((word) => (
                    <tr
                      key={word.id}
                      className="border-b border-border/50 hover:bg-bg-elevated/30"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium">{word.word}</td>
                      <td className="px-5 py-3.5 text-sm text-text-muted">
                        {hardWordTopicLabel(word.topic)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">
                        <p>{word.definition}</p>
                        {word.example && (
                          <p className="mt-1 text-xs text-text-muted italic">{word.example}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(word);
                              setShowForm(false);
                              setError(null);
                            }}
                            className="text-text-muted hover:text-accent"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(word.id)}
                            disabled={pending}
                            className="text-text-muted hover:text-red-400"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TopicChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-accent text-white"
          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}

function WordForm({
  initial,
  defaultTopic,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: HardWord;
  defaultTopic: string;
  pending: boolean;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-2xl border border-border bg-bg-card p-4"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="word"
          required
          defaultValue={initial?.word}
          placeholder="Слово *"
          className="rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <select
          name="topic"
          required
          defaultValue={initial?.topic ?? defaultTopic}
          className="rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
        >
          {HARD_WORD_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="definition"
        required
        rows={2}
        defaultValue={initial?.definition}
        placeholder="Значение, правило или пояснение *"
        className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <textarea
        name="example"
        rows={2}
        defaultValue={initial?.example}
        placeholder="Пример употребления (необязательно)"
        className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {pending ? "..." : initial ? "Сохранить" : "Добавить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary"
        >
          <X className="h-4 w-4" />
          Отмена
        </button>
      </div>
    </form>
  );
}
