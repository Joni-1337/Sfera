import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { resolveGuestSession } from "@/lib/session-guard";
import { CheckEmailForm } from "@/components/auth/CheckEmailForm";
import { getDevVerificationLinkForEmail } from "@/lib/email-verification";
import { AuthShell } from "@/components/layout/AuthShell";
import { MetrikaGoal } from "@/components/analytics/MetrikaGoal";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata;

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; warn?: string; local?: string }>;
}) {
  await resolveGuestSession();

  const { email: rawEmail, warn, local } = await searchParams;
  const email = rawEmail?.trim().toLowerCase() ?? "";

  if (!email) {
    redirect("/register");
  }

  const devLink = await getDevVerificationLinkForEmail(email);

  return (
    <AuthShell title="Подтвердите email" subtitle="Остался один шаг до входа">
      <MetrikaGoal goal="registration_submit" />
      <CheckEmailForm
        email={email}
        devLink={devLink}
        warning={warn ?? null}
        localMode={local === "1"}
      />
    </AuthShell>
  );
}
