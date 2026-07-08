import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";
import { hardWordTopicLabel } from "@/lib/hard-word-constants";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export type GlobalSearchResults = {
  texts: SearchResultItem[];
  assignments: SearchResultItem[];
  tests: SearchResultItem[];
  hardWords: SearchResultItem[];
};

const LIMIT = 15;

const EMPTY: GlobalSearchResults = {
  texts: [],
  assignments: [],
  tests: [],
  hardWords: [],
};

export async function globalSearch(
  session: SessionPayload,
  query: string
): Promise<GlobalSearchResults> {
  const q = query.trim();
  if (!q || q.length < 2) return EMPTY;

  if (session.role === "teacher") {
    const [texts, assignments, tests, hardWords] = await Promise.all([
      prisma.text.findMany({
        where: {
          OR: [{ title: { contains: q } }, { author: { contains: q } }],
        },
        take: LIMIT,
        orderBy: { title: "asc" },
        select: { id: true, title: true, author: true },
      }),
      prisma.assignment.findMany({
        where: {
          group: { teacherId: session.id },
          OR: [
            { title: { contains: q } },
            { group: { name: { contains: q } } },
          ],
        },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          groupId: true,
          group: { select: { name: true } },
        },
      }),
      prisma.test.findMany({
        where: {
          group: { teacherId: session.id },
          OR: [
            { title: { contains: q } },
            { group: { name: { contains: q } } },
          ],
        },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          groupId: true,
          group: { select: { name: true } },
        },
      }),
      prisma.hardWord.findMany({
        where: {
          teacherId: session.id,
          word: { contains: q },
        },
        take: LIMIT,
        orderBy: { word: "asc" },
        select: { id: true, word: true, topic: true },
      }),
    ]);

    return {
      texts: texts.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.author,
        href: `/texts/${t.id}`,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.group.name,
        href: `/dashboard/group/${a.groupId}/assignments/${a.id}`,
      })),
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.group.name,
        href: `/tests/${t.id}`,
      })),
      hardWords: hardWords.map((w) => ({
        id: w.id,
        title: w.word,
        subtitle: hardWordTopicLabel(w.topic),
        href: `/hard-words?topic=${w.topic}`,
      })),
    };
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: { group: true },
  });
  if (!student) return EMPTY;

  const [texts, assignments, tests, hardWords] = await Promise.all([
    prisma.text.findMany({
      where: {
        OR: [{ title: { contains: q } }, { author: { contains: q } }],
      },
      take: LIMIT,
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true },
    }),
    prisma.assignment.findMany({
      where: {
        published: true,
        groupId: student.groupId,
        title: { contains: q },
      },
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.test.findMany({
      where: {
        published: true,
        groupId: student.groupId,
        title: { contains: q },
      },
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.hardWord.findMany({
      where: {
        teacherId: student.group.teacherId,
        word: { contains: q },
      },
      take: LIMIT,
      orderBy: { word: "asc" },
      select: { id: true, word: true, topic: true },
    }),
  ]);

  return {
    texts: texts.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.author,
      href: `/texts/${t.id}`,
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: student.group.name,
      href: `/tasks/${a.id}`,
    })),
    tests: tests.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: student.group.name,
      href: `/tests/${t.id}`,
    })),
    hardWords: hardWords.map((w) => ({
      id: w.id,
      title: w.word,
      subtitle: hardWordTopicLabel(w.topic),
      href: `/hard-words?topic=${w.topic}`,
    })),
  };
}
