import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { TextForm } from "@/components/texts/TextForm";

export default async function NewTextPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  return (
    <AppShell>
      <TextForm mode="create" />
    </AppShell>
  );
}
