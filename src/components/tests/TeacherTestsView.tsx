"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical, Plus, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SearchInput } from "@/components/ui/SearchInput";

type Test = {
  id: string;
  title: string;
  published: boolean;
  dueAt: Date | null;
  createdAt: Date;
  _count: { questions: number; attempts: number };
};

type GroupWithTests = {
  id: string;
  name: string;
  tests: Test[];
};

function matchesSearch(text: string, query: string) {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function TeacherTestsView({
  groups,
  highlightGroupId,
}: {
  groups: GroupWithTests[];
  highlightGroupId?: string;
}) {
  const [search, setSearch] = useState("");
  const totalTests = groups.reduce((sum, g) => sum + g.tests.length, 0);

  const filteredGroups = useMemo(() => {
    let base = groups;
    if (highlightGroupId) {
      base = groups.filter((group) => group.id === highlightGroupId);
    }

    if (!search.trim()) return base;

    return base
      .map((group) => {
        const groupMatches = matchesSearch(group.name, search);
        const tests = group.tests.filter(
          (test) => groupMatches || matchesSearch(test.title, search)
        );

        if (groupMatches) {
          return group;
        }

        return tests.length > 0 ? { ...group, tests } : null;
      })
      .filter(Boolean) as GroupWithTests[];
  }, [groups, search, highlightGroupId]);

  if (totalTests === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-20 text-center">
        <FlaskConical className="mb-4 h-12 w-12 text-text-muted" />
        <p className="text-text-secondary">Тестов пока нет</p>
        <p className="mt-1 text-sm text-text-muted">
          Создайте пробный вариант ЕГЭ для группы
        </p>
        {groups.length > 0 && (
          <Link
            href={`/tests/new?groupId=${groups[0].id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Создать тест
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск по названию или группе…"
        className="mb-6 max-w-md"
      />

      {filteredGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-12 text-center text-sm text-text-muted">
          Ничего не найдено
        </p>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) =>
            group.tests.length === 0 ? null : (
              <section key={group.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{group.name}</h2>
                    <p className="text-sm text-text-muted">
                      {group.tests.length}{" "}
                      {group.tests.length === 1
                        ? "тест"
                        : group.tests.length < 5
                          ? "теста"
                          : "тестов"}
                    </p>
                  </div>
                  <Link
                    href={`/tests/new?groupId=${group.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/30 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    <Plus className="h-4 w-4" />
                    Создать тест
                  </Link>
                </div>

                <div className="space-y-3">
                  {group.tests.map((test) => (
                    <Link
                      key={test.id}
                      href={`/tests/${test.id}`}
                      className="block rounded-2xl border border-border bg-bg-card p-5 transition-all hover:border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{test.title}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                test.published
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-yellow-500/10 text-yellow-400"
                              }`}
                            >
                              {test.published ? (
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Опубликован
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <EyeOff className="h-3 w-3" />
                                  Черновик
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm text-accent">Открыть →</span>
                      </div>
                      <div className="mt-3 space-y-0.5 text-sm text-text-muted">
                        <p>
                          {test._count.questions}{" "}
                          {test._count.questions === 1
                            ? "вопрос"
                            : test._count.questions < 5
                              ? "вопроса"
                              : "вопросов"}
                        </p>
                        {test.dueAt && <p>до {formatDate(test.dueAt)}</p>}
                        {test._count.attempts > 0 && (
                          <p>
                            {test._count.attempts}{" "}
                            {test._count.attempts === 1 ? "попытка" : "попыток"}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
