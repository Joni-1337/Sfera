import { resolveGuestSession } from "@/lib/session-guard";
import { LoginForms } from "@/components/auth/LoginForms";
import { AuthShell } from "@/components/layout/AuthShell";

const VERIFY_MESSAGES: Record<string, string> = {
  missing:
    "Ссылка подтверждения неполная. Войдите с паролем — если email уже подтверждён, вход откроется.",
  failed:
    "Ссылка уже использована или устарела. Если вы уже подтверждали email — просто войдите с паролем.",
  server: "Ошибка сервера. Попробуйте войти с паролем.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string; hint?: string }>;
}) {
  await resolveGuestSession();
  const { verify, hint } = await searchParams;
  const verifyNotice =
    (verify && VERIFY_MESSAGES[verify]) ||
    (verify === "failed" && hint) ||
    null;

  return (
    <AuthShell title="Вход" subtitle="Ученик или преподаватель">
      <LoginForms verifyNotice={verifyNotice} />
    </AuthShell>
  );
}
