import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TextsView } from "@/components/texts/TextsView";
import { getTeacherSubscription, hasFullAccess } from "@/lib/subscription";

export default async function TextsPage({
  searchParams,
}: {
  searchParams: Promise<{
    authors?: string;
    types?: string;
    years?: string;
    topics?: string;
    q?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const isTeacher = session.role === "teacher";
  const teacherId = isTeacher ? session.id : null;

  const authorList = params.authors?.split(",").filter(Boolean) ?? [];
  const typeList = params.types?.split(",").filter(Boolean) ?? [];
  const yearList = params.years?.split(",").filter(Boolean).map(Number) ?? [];
  const topicList = params.topics?.split(",").filter(Boolean) ?? [];
  const query = params.q?.trim() ?? "";

  const texts = await prisma.text.findMany({
    where: {
      ...(authorList.length ? { author: { in: authorList } } : {}),
      ...(typeList.length ? { textType: { in: typeList } } : {}),
      ...(yearList.length ? { year: { in: yearList } } : {}),
      ...(topicList.length ? { topic: { in: topicList } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { author: { contains: query } },
              { content: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { year: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      textType: true,
      year: true,
      topic: true,
      teacherId: true,
    },
  });

  const allTexts = await prisma.text.findMany({
    select: { author: true, textType: true, year: true, topic: true },
  });

  const authors = [...new Set(allTexts.map((t) => t.author))].sort();
  const types = [...new Set(allTexts.map((t) => t.textType))].sort();
  const years = [...new Set(allTexts.map((t) => t.year))].sort((a, b) => b - a);
  const topics = [...new Set(allTexts.map((t) => t.topic))].sort();

  const subscription = isTeacher ? await getTeacherSubscription(session.id) : null;
  const canCreate = subscription ? hasFullAccess(subscription.plan) : false;

  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-text-muted">Загрузка...</div>}>
        <TextsView
          texts={texts}
          filters={{ authors, types, years, topics }}
          activeFilters={{
            authors: authorList,
            types: typeList,
            years: yearList,
            topics: topicList,
            q: query,
          }}
          isTeacher={isTeacher}
          teacherId={teacherId}
          canCreate={canCreate}
        />
      </Suspense>
    </AppShell>
  );
}
