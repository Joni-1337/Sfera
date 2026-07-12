import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { TextForm } from "@/components/texts/TextForm";
import { getTeacherSubscription, hasFullAccess } from "@/lib/subscription";

export default async function NewTextPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const subscription = await getTeacherSubscription(session.id);
  if (!subscription || !hasFullAccess(subscription.plan)) {
    redirect("/pricing");
  }

  return (
    <AppShell>
      <TextForm mode="create" />
    </AppShell>
  );
}
