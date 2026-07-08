"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import {
  publishAssignment,
  unpublishAssignment,
  deleteAssignment,
} from "@/lib/assignment-actions";
import { formatDate, RESULT_CATEGORIES } from "@/lib/utils";

type Assignment = {
  id: string;
  title: string;
  category: string;
  published: boolean;
  dueAt: Date | null;
  createdAt: Date;
  _count: { questions: number; attempts: number };
  attempts: { status: string }[];
};

function categoryLabel(id: string) {
  return RESULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function AssignmentsList({
  group,
}: {
  group: { id: string; name: string; assignments: Assignment[] };
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(action: (fd: FormData) => Promise<{ error?: string }>, assignmentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("assignmentId", assignmentId);
      await action(fd);
      router.refresh();
    });
  }

  const completedCount = (a: Assignment) =>
    a.attempts.filter((at) => at.status === "completed").length;

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к дашборду
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Задания</h1>
          <p className="text-text-secondary">{group.name}</p>
        </div>
        <Link
          href={`/dashboard/group/${group.id}/assignments/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Создать задание
        </Link>
      </div>

      {group.assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-16 text-center">
          <p className="text-text-secondary">Заданий пока нет</p>
          <p className="mt-1 text-sm text-text-muted">
            Создайте задание и опубликуйте его для учеников
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {group.assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/group/${group.id}/assignments/${a.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {a.title}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {a.published ? "Опубликовано" : "Черновик"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!a.published && (
                    <Link
                      href={`/dashboard/group/${group.id}/assignments/${a.id}/edit`}
                      title="Редактировать"
                      className="rounded-lg p-2 text-text-muted hover:bg-accent/10 hover:text-accent sm:inline-flex sm:items-center sm:gap-1.5 sm:border sm:border-border sm:px-3 sm:py-2 sm:text-sm sm:text-text-secondary sm:hover:border-accent/30"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Редактировать</span>
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/group/${group.id}/assignments/${a.id}`}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent/30 hover:text-accent"
                  >
                    Статистика
                  </Link>
                  {a.published ? (
                    <button
                      disabled={pending}
                      onClick={() => handleAction(unpublishAssignment, a.id)}
                      className="rounded-lg p-2 text-text-muted hover:text-yellow-400"
                      title="Снять с публикации"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      disabled={pending}
                      onClick={() => handleAction(publishAssignment, a.id)}
                      className="rounded-lg p-2 text-text-muted hover:text-green-400"
                      title="Опубликовать"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (confirm("Удалить задание и все результаты?")) {
                        handleAction(deleteAssignment, a.id);
                      }
                    }}
                    className="rounded-lg p-2 text-text-muted hover:text-red-400"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-0.5 text-sm text-text-muted">
                <p>{categoryLabel(a.category)}</p>
                <p>
                  {a._count.questions}{" "}
                  {a._count.questions === 1
                    ? "вопрос"
                    : a._count.questions < 5
                      ? "вопроса"
                      : "вопросов"}
                </p>
                <p>
                  выполнили {completedCount(a)} из {a._count.attempts || "—"}
                </p>
                {a.dueAt && <p>до {formatDate(a.dueAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
