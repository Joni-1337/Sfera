import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TeacherHardWordsManager } from "@/components/hard-words/TeacherHardWordsManager";
import { TeacherHardWordsProgress } from "@/components/hard-words/TeacherHardWordsProgress";
import { StudentHardWordsView } from "@/components/hard-words/StudentHardWordsView";
import { ensureDefaultHardWords } from "@/lib/default-hard-words";
import { getDailyWordState } from "@/lib/daily-words";

export default async function HardWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { topic } = await searchParams;

  if (session.role === "teacher") {
    await ensureDefaultHardWords(session.id);

    const [words, students, totalWords] = await Promise.all([
      prisma.hardWord.findMany({
        where: { teacherId: session.id },
        orderBy: [{ topic: "asc" }, { word: "asc" }],
        select: {
          id: true,
          topic: true,
          word: true,
          definition: true,
          example: true,
        },
      }),
      prisma.student.findMany({
        where: { group: { teacherId: session.id, archived: false } },
        orderBy: [{ group: { name: "asc" } }, { fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          wordStreak: true,
          group: { select: { name: true } },
          _count: { select: { hardWordProgress: true } },
          hardWordProgress: {
            select: { learnedAt: true },
            orderBy: { learnedAt: "desc" },
            take: 1,
          },
          wordDailySessions: {
            where: { completed: true },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { completedAt: true },
          },
        },
      }),
      prisma.hardWord.count({ where: { teacherId: session.id } }),
    ]);

    const progressStudents = students.map((student) => {
      const lastFromProgress = student.hardWordProgress[0]?.learnedAt ?? null;
      const lastFromDaily = student.wordDailySessions[0]?.completedAt ?? null;
      const lastActivity =
        lastFromProgress && lastFromDaily
          ? lastFromProgress > lastFromDaily
            ? lastFromProgress
            : lastFromDaily
          : lastFromProgress ?? lastFromDaily;

      return {
        id: student.id,
        fullName: student.fullName,
        groupName: student.group.name,
        learnedCount: student._count.hardWordProgress,
        totalWords,
        streak: student.wordStreak,
        lastActivity,
      };
    });

    return (
      <AppShell>
        <TeacherHardWordsProgress students={progressStudents} totalWords={totalWords} />
        <TeacherHardWordsManager words={words} initialTopic={topic} />
      </AppShell>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: { group: true },
  });
  if (!student) redirect("/login");

  await ensureDefaultHardWords(student.group.teacherId);

  const words = await prisma.hardWord.findMany({
    where: { teacherId: student.group.teacherId },
    orderBy: [{ topic: "asc" }, { word: "asc" }],
    select: {
      id: true,
      topic: true,
      word: true,
      definition: true,
      example: true,
    },
  });

  const dailyState = await getDailyWordState(session.id, student.group.teacherId);

  return (
    <AppShell>
      <StudentHardWordsView words={words} dailyState={dailyState} studentId={session.id} />
    </AppShell>
  );
}
