import { resolveGuestSession } from "@/lib/session-guard";
import { LoginForms } from "@/components/auth/LoginForms";
import { AuthShell } from "@/components/layout/AuthShell";

export default async function LoginPage() {
  await resolveGuestSession();

  return (
    <AuthShell title="Вход" subtitle="Ученик или преподаватель">
      <LoginForms />
    </AuthShell>
  );
}
