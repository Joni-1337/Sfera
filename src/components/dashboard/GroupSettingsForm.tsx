"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateGroup, archiveGroup, unarchiveGroup, deleteGroup } from "@/lib/actions";

export function GroupSettingsForm({
  group,
}: {
  group: { id: string; name: string; archived: boolean };
}) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRename(formData: FormData) {
    setNameError(null);
    setNameSuccess(false);
    formData.set("groupId", group.id);

    startTransition(async () => {
      const result = await updateGroup(formData);
      if (result?.error) {
        setNameError(result.error);
      } else {
        setNameSuccess(true);
        router.refresh();
      }
    });
  }

  function handleArchive() {
    if (!confirm(`Архивировать группу «${group.name}»? Она скроется с дашборда.`)) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("groupId", group.id);
      const result = await archiveGroup(fd);
      if (result?.error) setActionError(result.error);
    });
  }

  function handleUnarchive() {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("groupId", group.id);
      const result = await unarchiveGroup(fd);
      if (result?.error) {
        setActionError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Удалить группу «${group.name}» вместе со всеми учениками, заданиями и результатами? Это действие нельзя отменить.`
      )
    ) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("groupId", group.id);
      const result = await deleteGroup(fd);
      if (result?.error) setActionError(result.error);
    });
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к дашборду
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Настройки группы</h1>
      <p className="mb-8 text-text-secondary">{group.name}</p>

      <div className="max-w-xl space-y-6">
        <section className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Название</h2>
          <form action={handleRename} className="space-y-4">
            <input
              name="name"
              type="text"
              required
              defaultValue={group.name}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            />
            {nameError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {nameError}
              </p>
            )}
            {nameSuccess && (
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                Название сохранено
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "Сохранение..." : "Сохранить"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold">Архив</h2>
          <p className="mb-4 text-sm text-text-secondary">
            {group.archived
              ? "Группа в архиве и скрыта с основного дашборда."
              : "Архивная группа скрывается с дашборда. Ученики и задания сохраняются."}
          </p>
          {group.archived ? (
            <button
              type="button"
              onClick={handleUnarchive}
              disabled={pending}
              className="rounded-xl border border-accent/30 px-5 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {pending ? "Восстановление..." : "Восстановить из архива"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleArchive}
              disabled={pending}
              className="rounded-xl border border-yellow-500/30 px-5 py-2.5 text-sm font-medium text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50"
            >
              Архивировать группу
            </button>
          )}
        </section>

        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="mb-2 text-lg font-semibold text-red-400">Опасная зона</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Удаление группы безвозвратно удалит всех учеников, задания и результаты.
          </p>
          {actionError && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {actionError}
            </p>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            Удалить группу
          </button>
        </section>
      </div>
    </div>
  );
}
