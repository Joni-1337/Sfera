"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteText } from "@/lib/text-actions";

export function DeleteTextButton({
  textId,
  title,
  compact = false,
}: {
  textId: string;
  title: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Удалить текст «${title}»? Это действие нельзя отменить.`)) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("textId", textId);
      const result = await deleteText(fd);
      if (result?.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      title="Удалить"
      className={
        compact
          ? "rounded-lg p-2 text-text-muted hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          : "inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      }
    >
      <Trash2 className="h-4 w-4" />
      {!compact && (pending ? "Удаление..." : "Удалить")}
    </button>
  );
}
