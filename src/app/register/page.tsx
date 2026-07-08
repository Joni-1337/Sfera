import { redirect } from "next/navigation";
import { checkSession, CLEAR_SESSION_PATH } from "@/lib/session";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { usesLocalEmailVerification } from "@/lib/email";
import { AuthShell } from "@/components/layout/AuthShell";

export default async function RegisterPage() {
  const check = await checkSession();
  if (check.status === "stale") redirect(CLEAR_SESSION_PATH);
  if (check.status === "valid") {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт преподавателя — 3 дня бесплатно"
    >
      <RegisterForm localVerify={usesLocalEmailVerification()} />
    </AuthShell>
  );
}
