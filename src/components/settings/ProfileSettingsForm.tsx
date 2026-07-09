"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTeacherProfile } from "@/lib/actions";
import { btnPrimary } from "@/lib/button-styles";

export function ProfileSettingsForm({
  fullName: initialFullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateTeacherProfile(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-border bg-bg-elevated/50 px-4 py-3 text-sm text-text-muted outline-none"
        />
        <p className="mt-1.5 text-xs text-text-muted">
          Email нельзя изменить — он используется для входа
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">ФИО</label>
        <input
          name="fullName"
          type="text"
          required
          minLength={3}
          defaultValue={initialFullName}
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Профиль сохранён
        </p>
      )}

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Сохранение..." : "Сохранить профиль"}
      </button>
    </form>
  );
}
