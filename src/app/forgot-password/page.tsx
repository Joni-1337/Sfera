import { resolveGuestSession } from "@/lib/session-guard";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";
import { usesLocalEmailVerification } from "@/lib/email";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default async function ForgotPasswordPage() {
  await resolveGuestSession();

  return (
    <AuthShell title="Забыли пароль?" subtitle="Восстановление доступа преподавателя">
      <ForgotPasswordForm localMode={usesLocalEmailVerification()} />
    </AuthShell>
  );
}
