"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, FileText, ClipboardList, FlaskConical, BookMarked } from "lucide-react";
import type { GlobalSearchResults } from "@/lib/search-actions";

const SECTIONS: Array<{
  key: keyof GlobalSearchResults;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "texts", label: "Тексты", icon: FileText },
  { key: "assignments", label: "Задания", icon: ClipboardList },
  { key: "tests", label: "Тесты", icon: FlaskConical },
  { key: "hardWords", label: "Сложные слова", icon: BookMarked },
];

export function SearchView({
  query,
  results,
}: {
  query: string;
  results: GlobalSearchResults;
}) {
  const router = useRouter();
  const total = SECTIONS.reduce((sum, s) => sum + results[s.key].length, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">Поиск</h1>
      <p className="mb-6 text-text-secondary">
        Тексты, задания, тесты и слова из словаря
      </p>

      <form onSubmit={handleSubmit} className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Введите запрос..."
          autoFocus
          className="w-full rounded-xl border border-border bg-bg-elevated py-3 pl-11 pr-4 text-sm outline-none focus:border-accent"
        />
      </form>

      {!query ? (
        <p className="text-center text-sm text-text-muted">
          Введите минимум 2 символа для поиска
        </p>
      ) : query.length < 2 ? (
        <p className="text-center text-sm text-text-muted">
          Запрос слишком короткий — минимум 2 символа
        </p>
      ) : total === 0 ? (
        <p className="text-center text-sm text-text-muted">
          По запросу «{query}» ничего не найдено
        </p>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const items = results[key];
            if (items.length === 0) return null;

            return (
              <section key={key} className="rounded-2xl border border-border bg-bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  <Icon className="h-4 w-4" />
                  {label}
                  <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs tabular-nums">
                    {items.length}
                  </span>
                </h2>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg-elevated"
                      >
                        <span className="truncate text-sm font-medium">{item.title}</span>
                        {item.subtitle && (
                          <span className="shrink-0 truncate text-xs text-text-muted">
                            {item.subtitle}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
