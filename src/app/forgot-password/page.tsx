import { resolveGuestSession } from "@/lib/session-guard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";
import { usesLocalEmailVerification } from "@/lib/email";

export default async function ForgotPasswordPage() {
  await resolveGuestSession();

  return (
    <AuthShell title="Забыли пароль?" subtitle="Восстановление доступа преподавателя">
      <ForgotPasswordForm localMode={usesLocalEmailVerification()} />
    </AuthShell>
  );
}
