"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore } from "lucide-react";
import { unarchiveGroup } from "@/lib/actions";

export function UnarchiveGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleUnarchive() {
    if (!confirm(`Восстановить группу «${groupName}» из архива?`)) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("groupId", groupId);
      const result = await unarchiveGroup(fd);
      if (!result?.error) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleUnarchive}
      disabled={pending}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
    >
      <ArchiveRestore className="h-4 w-4" />
      {pending ? "Восстановление..." : "Восстановить из архива"}
    </button>
  );
}
