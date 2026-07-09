"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createGroup } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { btnPrimary } from "@/lib/button-styles";

export function AddGroupForm() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createGroup(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={btnPrimary}
      >
        <Plus className="h-5 w-5" />
        Добавить группу
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="w-full max-w-xs space-y-3">
      <input
        name="name"
        type="text"
        required
        autoFocus
        placeholder="Название группы"
        className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "..." : "Создать"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
