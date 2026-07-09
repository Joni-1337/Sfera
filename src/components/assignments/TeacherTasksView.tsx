"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Eye, EyeOff } from "lucide-react";
import { formatDate, RESULT_CATEGORIES } from "@/lib/utils";
import { SearchInput } from "@/components/ui/SearchInput";
import { btnCardAction, btnPrimary } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

type Assignment = {
  id: string;
  title: string;
  category: string;
  published: boolean;
  dueAt: Date | null;
  createdAt: Date;
  _count: { questions: number; attempts: number };
};

type GroupWithAssignments = {
  id: string;
  name: string;
  assignments: Assignment[];
};

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function matchesSearch(text: string, query: string) {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function TeacherTasksView({ groups }: { groups: GroupWithAssignments[] }) {
  const [search, setSearch] = useState("");
  const totalAssignments = groups.reduce((sum, g) => sum + g.assignments.length, 0);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;

    return groups
      .map((group) => {
        const groupMatches = matchesSearch(group.name, search);
        const assignments = group.assignments.filter(
          (assignment) =>
            groupMatches ||
            matchesSearch(assignment.title, search) ||
            matchesSearch(categoryLabel(assignment.category), search)
        );

        if (groupMatches) {
          return group;
        }

        return assignments.length > 0 ? { ...group, assignments } : null;
      })
      .filter(Boolean) as GroupWithAssignments[];
  }, [groups, search]);

  if (totalAssignments === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-20 text-center">
        <ClipboardList className="mb-4 h-12 w-12 text-text-muted" />
        <p className="text-text-secondary">Заданий пока нет</p>
        <p className="mt-1 text-sm text-text-muted">
          Создайте задание в группе на дашборде
        </p>
        <Link href="/dashboard" className={cn("mt-4", btnPrimary)}>
          <Plus className="h-4 w-4" />
          Перейти к группам
        </Link>
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
            group.assignments.length === 0 ? null : (
              <section key={group.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{group.name}</h2>
                    <p className="text-sm text-text-muted">
                      {group.assignments.length}{" "}
                      {group.assignments.length === 1 ? "задание" : "заданий"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/group/${group.id}/assignments/new`}
                    className={btnPrimary}
                  >
                    <Plus className="h-4 w-4" />
                    Создать задание
                  </Link>
                </div>

                <div className="space-y-3">
                  {group.assignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/dashboard/group/${group.id}/assignments/${assignment.id}`}
                      className="block rounded-2xl border border-border bg-bg-card p-5 transition-all hover:border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{assignment.title}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs ${
                                assignment.published ? "badge-published" : "badge-draft"
                              }`}
                            >
                              {assignment.published ? (
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Опубликовано
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
                        <span className={btnCardAction}>Открыть →</span>
                      </div>
                      <div className="mt-3 space-y-0.5 text-sm text-text-muted">
                        <p>{categoryLabel(assignment.category)}</p>
                        <p>
                          {assignment._count.questions}{" "}
                          {assignment._count.questions === 1
                            ? "вопрос"
                            : assignment._count.questions < 5
                              ? "вопроса"
                              : "вопросов"}
                        </p>
                        {assignment.dueAt && <p>до {formatDate(assignment.dueAt)}</p>}
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
