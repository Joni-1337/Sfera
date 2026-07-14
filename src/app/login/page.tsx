import { resolveGuestSession } from "@/lib/session-guard";
import type { Metadata } from "next";
import { LoginForms } from "@/components/auth/LoginForms";
import { AuthShell } from "@/components/layout/AuthShell";
import { MetrikaGoal } from "@/components/analytics/MetrikaGoal";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

const VERIFY_MESSAGES: Record<string, string> = {
  success: "Email подтверждён. Войдите с паролем.",
  missing:
    "Ссылка подтверждения неполная. Войдите с паролем — если email уже подтверждён, вход откроется.",
  failed:
    "Ссылка уже использована или устарела. Если вы уже подтверждали email — просто войдите с паролем.",
  server: "Ошибка сервера. Попробуйте войти с паролем.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verify?: string;
    hint?: string;
    email?: string;
    reset?: string;
  }>;
}) {
  await resolveGuestSession();
  const { verify, hint, email, reset } = await searchParams;
  const verifyNotice =
    (verify && VERIFY_MESSAGES[verify]) ||
    (verify === "failed" && hint) ||
    null;
  const isSuccess = verify === "success";
  const resetNotice = reset === "success" ? "Пароль обновлён. Войдите с новым паролем." : null;
  const presetEmail = email?.trim().toLowerCase() ?? "";

  return (
    <AuthShell title="Вход" subtitle="Ученик или преподаватель">
      {isSuccess ? <MetrikaGoal goal="registration_complete" /> : null}
      <LoginForms
        verifyNotice={verifyNotice}
        verifySuccess={isSuccess}
        presetEmail={presetEmail}
        resetNotice={resetNotice}
      />
    </AuthShell>
  );
}
