import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { GroupSettingsForm } from "@/components/dashboard/GroupSettingsForm";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, teacherId: session.id },
  });

  if (!group) notFound();

  return (
    <AppShell>
      <GroupSettingsForm group={group} />
    </AppShell>
  );
}
