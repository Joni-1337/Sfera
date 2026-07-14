import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { resolveGuestSession } from "@/lib/session-guard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { validatePasswordResetToken } from "@/lib/password-reset";
import { AuthShell } from "@/components/layout/AuthShell";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await resolveGuestSession();
  const { token } = await searchParams;

  if (!token?.trim()) {
    redirect("/forgot-password");
  }

  const check = await validatePasswordResetToken(token);
  if ("error" in check) {
    return (
      <AuthShell title="Сброс пароля" subtitle="Ссылка недействительна">
        <div className="rounded-2xl border border-border bg-bg-card p-6 text-center shadow-2xl shadow-black/40">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="mb-5 text-sm text-text-secondary">{check.error}</p>
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Запросить новую ссылку
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Новый пароль" subtitle={`Для ${check.email}`}>
      <ResetPasswordForm token={token.trim()} />
    </AuthShell>
  );
}
