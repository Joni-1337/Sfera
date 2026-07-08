"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createText, updateText } from "@/lib/text-actions";
import { TEXT_TYPES, TEXT_TOPIC_SUGGESTIONS } from "@/lib/text-constants";

type TextData = {
  id: string;
  title: string;
  author: string;
  textType: string;
  year: number;
  topic: string;
  content: string;
};

export function TextForm({
  mode,
  text,
}: {
  mode: "create" | "edit";
  text?: TextData;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  function handleSubmit(formData: FormData) {
    setError(null);
    if (mode === "edit" && text) {
      formData.set("textId", text.id);
    }

    startTransition(async () => {
      const result =
        mode === "create" ? await createText(formData) : await updateText(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result && "textId" in result && result.textId) {
        router.push(`/texts/${result.textId}`);
      }
    });
  }

  return (
    <div>
      <Link
        href={mode === "edit" && text ? `/texts/${text.id}` : "/texts"}
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        {mode === "edit" ? "Назад к тексту" : "Назад к текстам"}
      </Link>

      <h1 className="mb-1 text-2xl font-bold">
        {mode === "edit" ? "Редактирование текста" : "Новый текст"}
      </h1>
      <p className="mb-6 text-sm text-text-secondary">
        {mode === "edit"
          ? "Изменения будут видны всем пользователям платформы"
          : "Текст появится в общей библиотеке. Редактировать и удалять его сможете только вы"}
      </p>

      <form action={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Название</label>
          <input
            name="title"
            required
            defaultValue={text?.title}
            placeholder="Весенний лес"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Автор</label>
          <input
            name="author"
            required
            defaultValue={text?.author}
            placeholder="Астафьев В.П."
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Тип текста</label>
            <select
              name="textType"
              required
              defaultValue={text?.textType ?? TEXT_TYPES[0]}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            >
              {TEXT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Год</label>
            <input
              name="year"
              type="number"
              required
              min={1900}
              max={2100}
              defaultValue={text?.year ?? currentYear}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Тема</label>
          <input
            name="topic"
            required
            list="topic-suggestions"
            defaultValue={text?.topic}
            placeholder="Природа"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <datalist id="topic-suggestions">
            {TEXT_TOPIC_SUGGESTIONS.map((topic) => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Текст</label>
          <textarea
            name="content"
            required
            rows={14}
            defaultValue={text?.content}
            placeholder="Вставьте полный текст для чтения..."
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm leading-relaxed outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-text-muted">
            Минимум 50 символов. Сохраняются переносы строк, отступы и абзацы (пустая строка между
            абзацами).
          </p>
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
            {pending
              ? "Сохранение..."
              : mode === "edit"
                ? "Сохранить изменения"
                : "Добавить текст"}
          </button>
          <Link
            href={mode === "edit" && text ? `/texts/${text.id}` : "/texts"}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
