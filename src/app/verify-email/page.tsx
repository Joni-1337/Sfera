import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAndLogin } from "@/lib/actions";
import { AuthShell } from "@/components/layout/AuthShell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token?.trim()) {
    return (
      <VerifyEmailResult
        success={false}
        message="Ссылка недействительна. Запросите новое письмо со страницы входа."
      />
    );
  }

  const result = await verifyEmailAndLogin(token);
  if (result?.error) {
    return <VerifyEmailResult success={false} message={result.error} />;
  }

  return (
    <VerifyEmailResult
      success
      message="Email подтверждён. Сейчас откроется личный кабинет..."
    />
  );
}

function VerifyEmailResult({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-border bg-bg-card p-6 text-center shadow-2xl shadow-black/40">
        {success ? (
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" />
        ) : (
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        )}
        <h1 className="mb-2 text-xl font-semibold">
          {success ? "Готово!" : "Не удалось подтвердить"}
        </h1>
        <p className="mb-5 text-sm text-text-secondary">{message}</p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Перейти ко входу
        </Link>
      </div>
    </AuthShell>
  );
}
