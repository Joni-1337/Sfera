import "server-only";



import { prisma } from "@/lib/prisma";

import { shuffleWithSeed } from "@/lib/shuffle";

import {

  DAILY_WORD_COUNT,

  buildStreakProgress,

  collectShownWordIds,

  computeBestStreakFromCompletedDates,

  computeStreakFromCompletedDates,

  getTodayDateKey,

  getDateKeyDaysAgo,

  parseWordIds,

  pickDailyWordIds,

  serializeWordIds,

  streakLabel,

  type DailyWordItem,

  type DailyWordState,

} from "@/lib/daily-words-shared";
import { cleanHardWordAnswer } from "@/lib/hard-words-utils";



export type { DailyWordItem, DailyWordState };



async function getCompletedSessionDates(studentId: string) {
  const cutoff = getDateKeyDaysAgo(120);

  const sessions = await prisma.wordDailySession.findMany({
    where: { studentId, completed: true, sessionDate: { gte: cutoff } },
    select: { sessionDate: true },
  });

  return new Set(sessions.map((session) => session.sessionDate));
}



function resolveWordStreak(

  completedDates: Set<string>,

  dateKey: string,

  storedBest: number

) {

  const streak = computeStreakFromCompletedDates(completedDates, dateKey);

  const streakBest = Math.max(storedBest, computeBestStreakFromCompletedDates(completedDates));

  const streakLastDate =

    streak > 0

      ? completedDates.has(dateKey)

        ? dateKey

        : [...completedDates].sort().at(-1) ?? null

      : null;



  return { streak, streakBest, streakLastDate };

}



export async function getDailyWordState(studentId: string, teacherId: string): Promise<DailyWordState> {

  const dateKey = getTodayDateKey();



  const [student, words, session, pastSessions, completedDates] = await Promise.all([

    prisma.student.findUnique({

      where: { id: studentId },

      select: {

        wordStreak: true,

        wordStreakBest: true,

        wordStreakLastDate: true,

      },

    }),

    prisma.hardWord.findMany({

      where: { teacherId },

      orderBy: { word: "asc" },

      include: {

        progress: {

          where: { studentId },

          select: { id: true },

        },

      },

    }),

    prisma.wordDailySession.findUnique({

      where: {

        studentId_sessionDate: { studentId, sessionDate: dateKey },

      },

    }),

    prisma.wordDailySession.findMany({

      where: {

        studentId,

        sessionDate: { not: dateKey },

      },

      select: { wordIds: true },

    }),

    getCompletedSessionDates(studentId),

  ]);



  if (!student) {

    return {

      dateKey,

      streak: 0,

      streakBest: 0,

      streakLabel: "0",

      streakProgress: buildStreakProgress(0),

      completedToday: false,

      todayScore: null,

      words: [],

      canStart: false,

      totalWords: 0,

      learnedCount: 0,

    };

  }



  const wordItems = words.map((word) => ({

    id: word.id,

    topic: word.topic,

    word: cleanHardWordAnswer(word.word),

    definition: word.definition,

    example: word.example,

    learned: word.progress.length > 0,

  }));



  let activeSession = session;



  if (!activeSession && wordItems.length >= DAILY_WORD_COUNT) {

    const shownWordIds = collectShownWordIds(pastSessions);

    const ids = pickDailyWordIds(

      wordItems.map(({ id, learned }) => ({ id, learned })),

      shownWordIds,

      studentId,

      dateKey,

      shuffleWithSeed

    );



    activeSession = await prisma.wordDailySession.create({

      data: {

        studentId,

        sessionDate: dateKey,

        wordIds: serializeWordIds(ids),

        maxScore: ids.length,

      },

    });

  }



  const selectedIds = activeSession ? parseWordIds(activeSession.wordIds) : [];

  const dailyWords = selectedIds

    .map((id) => wordItems.find((word) => word.id === id))

    .filter(Boolean) as DailyWordItem[];



  const totalWords = wordItems.length;

  const learnedCount = wordItems.filter((word) => word.learned).length;



  const { streak, streakBest, streakLastDate } = resolveWordStreak(

    completedDates,

    dateKey,

    student.wordStreakBest

  );



  if (

    streak !== student.wordStreak ||

    streakBest !== student.wordStreakBest ||

    streakLastDate !== student.wordStreakLastDate

  ) {

    await prisma.student.update({

      where: { id: studentId },

      data: {

        wordStreak: streak,

        wordStreakBest: streakBest,

        wordStreakLastDate: streakLastDate,

      },

    });

  }



  return {

    dateKey,

    streak,

    streakBest,

    streakLabel: streakLabel(streak),

    streakProgress: buildStreakProgress(streak),

    completedToday: activeSession?.completed ?? false,

    todayScore: activeSession?.completed ? activeSession.score : null,

    words: dailyWords,

    canStart: wordItems.length >= DAILY_WORD_COUNT && dailyWords.length > 0,

    totalWords,

    learnedCount,

  };

}



export async function applyDailyQuizResult(

  studentId: string,

  sessionDate: string,

  score: number,

  maxScore: number

) {

  const todayKey = getTodayDateKey();

  if (sessionDate !== todayKey) {

    return { error: "Сессия устарела — обновите страницу" };

  }



  const session = await prisma.wordDailySession.findUnique({

    where: {

      studentId_sessionDate: { studentId, sessionDate },

    },

  });



  if (!session) return { error: "Дневная сессия не найдена" };

  if (session.completed) return { error: "Сегодняшний урок уже пройден" };



  const student = await prisma.student.findUnique({

    where: { id: studentId },

    select: {

      wordStreak: true,

      wordStreakBest: true,

      wordStreakLastDate: true,

    },

  });



  if (!student) return { error: "Ученик не найден" };



  const passed = score === maxScore;

  const completedDates = await getCompletedSessionDates(studentId);

  const previousStreak = computeStreakFromCompletedDates(completedDates, todayKey);



  if (passed) {

    completedDates.add(todayKey);

  }



  const { streak: newStreak, streakBest: newBest } = resolveWordStreak(

    completedDates,

    todayKey,

    student.wordStreakBest

  );

  const streakIncreased = passed && newStreak > previousStreak;

  const streakRestarted = passed && newStreak === 1 && previousStreak > 1;



  await prisma.$transaction([

    prisma.wordDailySession.update({

      where: { id: session.id },

      data: {

        score,

        maxScore,

        completed: passed,

        completedAt: passed ? new Date() : null,

      },

    }),

    ...(passed

      ? [

          prisma.student.update({

            where: { id: studentId },

            data: {

              wordStreak: newStreak,

              wordStreakBest: newBest,

              wordStreakLastDate: todayKey,

            },

          }),

        ]

      : []),

  ]);



  return {

    success: true,

    passed,

    score,

    maxScore,

    streak: passed ? newStreak : student.wordStreak,

    streakBest: passed ? newBest : student.wordStreakBest,

    streakIncreased,

    streakRestarted,

  };

}

