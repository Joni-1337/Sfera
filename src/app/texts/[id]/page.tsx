import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { DeleteTextButton } from "@/components/texts/DeleteTextButton";
import { FormattedTextContent } from "@/components/texts/FormattedTextContent";

export default async function TextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const text = await prisma.text.findUnique({ where: { id } });
  if (!text) notFound();

  const canManage =
    session.role === "teacher" && text.teacherId === session.id;

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl">
        <Link
          href="/texts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к текстам
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{text.title}</h1>
              <p className="mt-2 text-text-secondary">
                {text.author} · {text.textType} · {text.year}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                  {text.topic}
                </span>
                {canManage && (
                  <span className="inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
                    Мой текст
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/texts/${text.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent"
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Link>
                <DeleteTextButton textId={text.id} title={text.title} />
              </div>
            )}
          </div>
        </header>

        <div className="rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
          <FormattedTextContent content={text.content} />
        </div>
      </article>
    </AppShell>
  );
}
