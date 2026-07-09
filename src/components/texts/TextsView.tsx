"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Search,
  BookOpen,
  SlidersHorizontal,
  X,
  ExternalLink,
  Plus,
  Pencil,
} from "lucide-react";
import { DeleteTextButton } from "@/components/texts/DeleteTextButton";
import { CheckboxFilterItem } from "@/components/ui/Checkbox";

type Text = {
  id: string;
  title: string;
  author: string;
  textType: string;
  year: number;
  topic: string;
  teacherId: string | null;
};

type Filters = {
  authors: string[];
  types: string[];
  years: number[];
  topics: string[];
};

type ActiveFilters = {
  authors: string[];
  types: string[];
  years: number[];
  topics: string[];
  q: string;
};

export function TextsView({
  texts,
  filters,
  activeFilters,
  isTeacher = false,
  teacherId = null,
}: {
  texts: Text[];
  filters: Filters;
  activeFilters: ActiveFilters;
  isTeacher?: boolean;
  teacherId?: string | null;
}) {
  const router = useRouter();

  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(activeFilters.authors);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(activeFilters.types);
  const [selectedYears, setSelectedYears] = useState<number[]>(activeFilters.years);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(activeFilters.topics);
  const [query, setQuery] = useState(activeFilters.q);
  const [authorSearch, setAuthorSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeCount =
    selectedAuthors.length +
    selectedTypes.length +
    selectedYears.length +
    selectedTopics.length +
    (query ? 1 : 0);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedAuthors.length) params.set("authors", selectedAuthors.join(","));
    if (selectedTypes.length) params.set("types", selectedTypes.join(","));
    if (selectedYears.length) params.set("years", selectedYears.join(","));
    if (selectedTopics.length) params.set("topics", selectedTopics.join(","));
    if (query.trim()) params.set("q", query.trim());
    router.push(`/texts?${params.toString()}`);
    setMobileFiltersOpen(false);
  }, [router, selectedAuthors, selectedTypes, selectedYears, selectedTopics, query]);

  const resetFilters = useCallback(() => {
    setSelectedAuthors([]);
    setSelectedTypes([]);
    setSelectedYears([]);
    setSelectedTopics([]);
    setQuery("");
    router.push("/texts");
    setMobileFiltersOpen(false);
  }, [router]);

  const pushFilters = useCallback(
    (next: {
      authors?: string[];
      types?: string[];
      years?: number[];
      topics?: string[];
      q?: string;
    }) => {
      const authors = next.authors ?? selectedAuthors;
      const types = next.types ?? selectedTypes;
      const years = next.years ?? selectedYears;
      const topics = next.topics ?? selectedTopics;
      const q = next.q ?? query;

      setSelectedAuthors(authors);
      setSelectedTypes(types);
      setSelectedYears(years);
      setSelectedTopics(topics);
      setQuery(q);

      const params = new URLSearchParams();
      if (authors.length) params.set("authors", authors.join(","));
      if (types.length) params.set("types", types.join(","));
      if (years.length) params.set("years", years.join(","));
      if (topics.length) params.set("topics", topics.join(","));
      if (q.trim()) params.set("q", q.trim());
      router.push(`/texts?${params.toString()}`);
    },
    [router, selectedAuthors, selectedTypes, selectedYears, selectedTopics, query]
  );

  const appliedCount =
    activeFilters.authors.length +
    activeFilters.types.length +
    activeFilters.years.length +
    activeFilters.topics.length +
    (activeFilters.q ? 1 : 0);

  const filterPanel = (
    <FiltersPanel
      filters={filters}
      selectedAuthors={selectedAuthors}
      setSelectedAuthors={setSelectedAuthors}
      selectedTypes={selectedTypes}
      setSelectedTypes={setSelectedTypes}
      selectedYears={selectedYears}
      setSelectedYears={setSelectedYears}
      selectedTopics={selectedTopics}
      setSelectedTopics={setSelectedTopics}
      query={query}
      setQuery={setQuery}
      authorSearch={authorSearch}
      setAuthorSearch={setAuthorSearch}
      onApply={applyFilters}
      onReset={resetFilters}
      activeCount={activeCount}
    />
  );

  return (
    <div className="flex gap-6">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="mb-1 text-lg font-semibold">Тексты</h2>
          <p className="mb-4 text-sm text-text-muted">Фильтры</p>
          {filterPanel}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Тексты</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Библиотека текстов для подготовки к заданиям ЕГЭ по чтению
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isTeacher && (
              <Link
                href="/texts/new"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" />
                Добавить текст
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Фильтры
              {activeCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {appliedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {activeFilters.q && (
              <FilterChip
                label={`«${activeFilters.q}»`}
                onRemove={() => pushFilters({ q: "" })}
              />
            )}
            {activeFilters.authors.map((a) => (
              <FilterChip
                key={a}
                label={a}
                onRemove={() =>
                  pushFilters({
                    authors: activeFilters.authors.filter((x) => x !== a),
                  })
                }
              />
            ))}
            {activeFilters.types.map((t) => (
              <FilterChip
                key={t}
                label={t}
                onRemove={() =>
                  pushFilters({ types: activeFilters.types.filter((x) => x !== t) })
                }
              />
            ))}
            {activeFilters.years.map((y) => (
              <FilterChip
                key={y}
                label={String(y)}
                onRemove={() =>
                  pushFilters({ years: activeFilters.years.filter((x) => x !== y) })
                }
              />
            ))}
            {activeFilters.topics.map((t) => (
              <FilterChip
                key={t}
                label={t}
                onRemove={() =>
                  pushFilters({ topics: activeFilters.topics.filter((x) => x !== t) })
                }
              />
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-text-muted hover:text-accent"
            >
              Сбросить всё
            </button>
          </div>
        )}

        <p className="mb-4 text-sm text-text-muted">
          Найдено: {texts.length}{" "}
          {texts.length === 1 ? "текст" : texts.length < 5 ? "текста" : "текстов"}
        </p>

        {texts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-card py-20 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-text-muted" />
            <p className="text-text-secondary">Тексты не найдены</p>
            <p className="mt-1 text-sm text-text-muted">Попробуйте изменить фильтры или поиск</p>
            {appliedCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm text-accent hover:underline"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {texts.map((text) => {
              const isOwn = teacherId !== null && text.teacherId === teacherId;
              const textUrl = `/texts/${text.id}`;

              return (
                <div
                  key={text.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card p-5 transition-all hover:border-accent/20"
                >
                  <Link href={textUrl} className="group min-w-0 flex-1">
                    <h3 className="font-semibold transition-colors group-hover:text-accent">
                      {text.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {text.author} · {text.textType} · {text.year}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                        {text.topic}
                      </span>
                      {isOwn && (
                        <span className="inline-block rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-400">
                          Мой текст
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={textUrl}
                      title="Открыть текст"
                      className="rounded-lg p-2 text-text-muted hover:bg-accent/10 hover:text-accent"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    {isOwn && (
                      <>
                        <Link
                          href={`/texts/${text.id}/edit`}
                          title="Редактировать"
                          className="rounded-lg p-2 text-text-muted hover:bg-accent/10 hover:text-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteTextButton textId={text.id} title={text.title} compact />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mobileFiltersOpen && (
        <div className="overlay-enter fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="panel-enter-up absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Фильтры</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

function FiltersPanel({
  filters,
  selectedAuthors,
  setSelectedAuthors,
  selectedTypes,
  setSelectedTypes,
  selectedYears,
  setSelectedYears,
  selectedTopics,
  setSelectedTopics,
  query,
  setQuery,
  authorSearch,
  setAuthorSearch,
  onApply,
  onReset,
  activeCount,
}: {
  filters: Filters;
  selectedAuthors: string[];
  setSelectedAuthors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedYears: number[];
  setSelectedYears: React.Dispatch<React.SetStateAction<number[]>>;
  selectedTopics: string[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  authorSearch: string;
  setAuthorSearch: React.Dispatch<React.SetStateAction<string>>;
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
}) {
  const filteredAuthors = filters.authors.filter((a) =>
    a.toLowerCase().includes(authorSearch.toLowerCase())
  );

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onApply();
  }

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Поиск по названию, автору, тексту..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Search className="h-4 w-4" />
          Показать
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-border px-3 py-2.5 text-sm text-text-secondary hover:border-accent/30"
            title="Сбросить"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <FilterSection title="Авторы">
        <input
          type="text"
          placeholder="Искать автора"
          value={authorSearch}
          onChange={(e) => setAuthorSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs outline-none focus:border-accent"
        />
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {filteredAuthors.map((author) => (
            <CheckboxFilterItem
              key={author}
              label={author}
              checked={selectedAuthors.includes(author)}
              onChange={(checked) =>
                setSelectedAuthors((prev) =>
                  checked ? [...prev, author] : prev.filter((a) => a !== author)
                )
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Тип текста">
        {filters.types.map((type) => (
          <CheckboxFilterItem
            key={type}
            label={type}
            checked={selectedTypes.includes(type)}
            onChange={(checked) =>
              setSelectedTypes((prev) =>
                checked ? [...prev, type] : prev.filter((t) => t !== type)
              )
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Год">
        {filters.years.map((year) => (
          <CheckboxFilterItem
            key={year}
            label={String(year)}
            checked={selectedYears.includes(year)}
            onChange={(checked) =>
              setSelectedYears((prev) =>
                checked ? [...prev, year] : prev.filter((y) => y !== year)
              )
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Тема">
        {filters.topics.map((topic) => (
          <CheckboxFilterItem
            key={topic}
            label={topic}
            checked={selectedTopics.includes(topic)}
            onChange={(checked) =>
              setSelectedTopics((prev) =>
                checked ? [...prev, topic] : prev.filter((t) => t !== topic)
              )
            }
          />
        ))}
      </FilterSection>
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-accent-hover">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-t border-border pt-4 first:border-0 first:pt-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
