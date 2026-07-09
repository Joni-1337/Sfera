"use client";

import { useState, useTransition } from "react";
import { changeTeacherPassword } from "@/lib/actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { btnSecondary } from "@/lib/button-styles";

export function PasswordSettingsForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changeTeacherPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">
          Текущий пароль
        </label>
        <PasswordInput name="currentPassword" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            Новый пароль
          </label>
          <PasswordInput name="newPassword" required minLength={6} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">
            Подтверждение
          </label>
          <PasswordInput name="confirmPassword" required minLength={6} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Пароль успешно изменён
        </p>
      )}

      <button type="submit" disabled={pending} className={btnSecondary}>
        {pending ? "Сохранение..." : "Сохранить пароль"}
      </button>
    </form>
  );
}
