import Link from "next/link";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Ссылка недействительна. Запросите новое письмо со страницы входа.",
  server:
    "Ошибка сервера при подтверждении. Попробуйте войти вручную или запросите новое письмо.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error: errorKey } = await searchParams;

  if (token?.trim()) {
    redirect(`/api/verify-email?token=${encodeURIComponent(token.trim())}`);
  }

  const message =
    (errorKey && ERROR_MESSAGES[errorKey]) ||
    errorKey ||
    "Ссылка для подтверждения устарела. Запросите новое письмо на странице входа.";

  return (
    <AuthShell title="Подтверждение email" subtitle="Не удалось завершить вход">
      <div className="rounded-2xl border border-border bg-bg-card p-6 text-center shadow-2xl shadow-black/40">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-xl font-semibold">Не удалось подтвердить</h1>
        <p className="mb-5 text-sm text-text-secondary">{message}</p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Перейти ко входу
        </Link>
      </div>
    </AuthShell>
  );
}
