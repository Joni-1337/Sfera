import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TextForm } from "@/components/texts/TextForm";

export default async function EditTextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const { id } = await params;

  const text = await prisma.text.findFirst({
    where: { id, teacherId: session.id },
  });

  if (!text) notFound();

  return (
    <AppShell>
      <TextForm mode="edit" text={text} />
    </AppShell>
  );
}
