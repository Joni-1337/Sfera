"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Flame,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { submitDailyWordQuiz } from "@/lib/daily-word-actions";
import { hardWordTopicLabel } from "@/lib/hard-word-constants";
import { WordContentBlocks } from "@/components/hard-words/WordContentBlocks";
import { streakLabel, buildStreakProgress } from "@/lib/daily-words-shared";
import type { DailyWordItem, DailyWordState } from "@/lib/daily-words-shared";
import { shuffleArray } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

type Phase = "intro" | "study" | "quiz" | "done";

type WordResult = {
  wordId: string;
  word: string;
  userAnswer: string;
  correct: boolean;
};

type QuizResult = {
  passed: boolean;
  score: number;
  maxScore: number;
  streak: number;
  streakBest: number;
  streakIncreased: boolean;
  streakRestarted: boolean;
  wordResults: WordResult[];
};

export function DailyWordChallenge({
  state,
  compact = false,
  onDictionaryHidden,
}: {
  state: DailyWordState;
  compact?: boolean;
  onDictionaryHidden?: (hidden: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>(
    state.completedToday ? "done" : "intro"
  );
  const [studyIndex, setStudyIndex] = useState(0);
  const [quizWords, setQuizWords] = useState<DailyWordItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(
    state.completedToday && state.todayScore !== null
      ? {
          passed: state.todayScore === state.words.length,
          score: state.todayScore,
          maxScore: state.words.length,
          streak: state.streak,
          streakBest: state.streakBest,
          streakIncreased: false,
          streakRestarted: false,
          wordResults: [],
        }
      : null
  );
  const [pending, startTransition] = useTransition();

  const currentQuizWord = quizWords[quizIndex];
  const studyWord = state.words[studyIndex];

  const displayStreak = result?.passed ? result.streak : state.streak;
  const displayStreakBest = result?.passed ? result.streakBest : state.streakBest;
  const weekDots = buildStreakProgress(displayStreak);

  const progress =
    state.totalWords > 0
      ? Math.round((state.learnedCount / state.totalWords) * 100)
      : 0;
  const remaining = state.totalWords - state.learnedCount;

  const dictionaryHidden =
    phase === "study" ||
    phase === "quiz" ||
    (phase === "done" && result !== null && !result.passed && !state.completedToday);

  useEffect(() => {
    onDictionaryHidden?.(dictionaryHidden);
  }, [dictionaryHidden, onDictionaryHidden]);

  if (state.totalWords === 0) {
    return null;
  }

  function startStudy() {
    setPhase("study");
    setStudyIndex(0);
    setQuizWords([]);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  function finishStudy() {
    setQuizWords(shuffleArray(state.words));
    setPhase("quiz");
    setQuizIndex(0);
    setAnswers({});
    setError(null);
  }

  function retryQuiz() {
    setQuizWords(shuffleArray(state.words));
    setPhase("quiz");
    setQuizIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  function submitQuizAnswer() {
    if (!currentQuizWord) return;
    const answer = answers[currentQuizWord.id]?.trim() ?? "";
    if (!answer) {
      setError("Введите ответ");
      return;
    }

    setError(null);

    const nextAnswers = { ...answers, [currentQuizWord.id]: answer };

    if (quizIndex < quizWords.length - 1) {
      setAnswers(nextAnswers);
      setQuizIndex((value) => value + 1);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("sessionDate", state.dateKey);
      state.words.forEach((word) => formData.append("wordIds", word.id));
      state.words.forEach((word) => {
        formData.set(`answer_${word.id}`, nextAnswers[word.id]?.trim() ?? "");
      });

      const response = await submitDailyWordQuiz(formData);
      if (!("wordResults" in response)) {
        setError("error" in response && response.error ? response.error : "Ошибка отправки");
        return;
      }

      setResult({
        passed: Boolean(response.passed),
        score: response.score ?? 0,
        maxScore: response.maxScore ?? state.words.length,
        streak: response.streak ?? state.streak,
        streakBest: response.streakBest ?? state.streakBest,
        streakIncreased: Boolean(response.streakIncreased),
        streakRestarted: Boolean(response.streakRestarted),
        wordResults: response.wordResults ?? [],
      });
      setPhase("done");
    });
  }

  const wrongAnswers = result?.wordResults.filter((item) => !item.correct) ?? [];

  const card = (
    <div
      id="daily"
      className={cn(
        "overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-bg-card to-bg-card",
        compact ? "p-4" : "mb-8 p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-300">
            <Flame className="h-3.5 w-3.5" />
            Ударный режим
          </div>
          <h2 className={cn("font-bold", compact ? "text-lg" : "text-xl")}>
            Сложные слова — незабываем повторять
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Каждый день 3 слова и мини-тест. Все верно — слово засчитывается и +1 к серии
            <span className="text-text-muted"> (только подряд, без пропусков)</span>.
          </p>
        </div>

        <div className="grid w-full shrink-0 grid-cols-2 rounded-2xl border border-border/80 bg-bg-elevated/70 sm:w-auto sm:min-w-[220px]">
          <div className="flex flex-col items-center justify-center border-r border-border px-3 py-3 text-center sm:px-4">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold leading-none">{displayStreak}</p>
            <p className="mt-1 text-[11px] leading-tight text-text-muted">
              {streakLabel(displayStreak)}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-3 text-center sm:px-4">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold leading-none">{displayStreakBest}</p>
            <p className="mt-1 text-[11px] leading-tight text-text-muted">рекорд</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {weekDots.map((slot) => (
          <div
            key={slot.index}
            className={cn(
              "h-2.5 flex-1 rounded-full",
              slot.completed ? "bg-orange-400" : "bg-border"
            )}
            title={`${slot.index + 1} из 7`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Серия подряд · заполняется слева направо (до 7 дней)
      </p>

      <div className="mt-4 rounded-xl border border-border/70 bg-bg-elevated/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-text-secondary">
            Выучено{" "}
            <span className="font-semibold text-accent">{state.learnedCount}</span>
            <span className="text-text-muted"> из {state.totalWords}</span>
          </span>
          {remaining > 0 && (
            <span className="text-text-secondary">
              Осталось <span className="font-semibold text-text-primary">{remaining}</span>
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {progress === 100
            ? "Весь словарь пройден — ударный режим продолжает повторение"
            : "Слова засчитываются только после успешного прохождения мини-теста"}
        </p>
      </div>

      {!state.canStart && !state.completedToday && (
        <p className="mt-4 text-sm text-text-muted">
          Для ударного режима нужно минимум 3 слова в словаре.
        </p>
      )}

      {phase === "intro" && !state.completedToday && state.canStart && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startStudy}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <BookOpen className="h-4 w-4" />
            Начать на сегодня
          </button>
          {!compact && <p className="text-sm text-text-muted">3 слова · ~3 минуты</p>}
        </div>
      )}

      {phase === "study" && studyWord && (
        <div className="mt-5 rounded-2xl border border-border bg-bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
            Запоминание {studyIndex + 1}/{state.words.length}
          </p>
          <p className="text-3xl font-bold tracking-tight">{studyWord.word}</p>
          <span className="mt-2 inline-flex rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            {hardWordTopicLabel(studyWord.topic)}
          </span>

          <WordContentBlocks
            className="mt-4"
            definition={studyWord.definition}
            example={studyWord.example}
            compact
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {studyIndex < state.words.length - 1 ? (
              <button
                type="button"
                onClick={() => setStudyIndex((value) => value + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                Дальше
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishStudy}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                К мини-тесту
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "quiz" && currentQuizWord && (
        <div className="mt-5 rounded-2xl border border-border bg-bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
            Мини-тест {quizIndex + 1}/{quizWords.length}
          </p>
          <p className="text-sm text-text-secondary">Напишите слово по правилу:</p>
          <div className="mt-3 rounded-xl bg-bg-elevated/70 px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent/80">
              Правило
            </p>
            <p className="text-base font-medium leading-relaxed">{currentQuizWord.definition}</p>
          </div>
          <input
            value={answers[currentQuizWord.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [currentQuizWord.id]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") submitQuizAnswer();
            }}
            placeholder="Введите слово"
            className="mt-4 w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={submitQuizAnswer}
            className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending
              ? "Проверяем..."
              : quizIndex < quizWords.length - 1
                ? "Ответить"
                : "Завершить"}
          </button>
        </div>
      )}

      {(phase === "done" || state.completedToday) && result && (
        <div className="mt-5 rounded-2xl border border-border bg-bg-card p-5">
          <div className="flex items-start gap-3">
            {result.passed ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-400" />
            ) : (
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {result.passed
                  ? result.streakRestarted
                    ? "Отлично! Серия начата заново"
                    : result.streakIncreased
                      ? "Отлично! Серия продолжается"
                      : "Отлично! День засчитан"
                  : "Есть ошибки — попробуйте ещё раз"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Результат: {result.score}/{result.maxScore}
                {result.passed && <> · серия: {streakLabel(result.streak)}</>}
              </p>
              {result.passed && result.streakIncreased && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-orange-300">
                  <Sparkles className="h-4 w-4" />
                  +1 день к ударному режиму · рекорд {result.streakBest}
                </p>
              )}
              {result.passed && result.streakRestarted && (
                <p className="mt-2 text-sm text-text-muted">
                  Пропущенный день сбросил серию — сегодня начинается с 1
                </p>
              )}
            </div>
          </div>

          {!result.passed && wrongAnswers.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Ошибки
              </p>
              {wrongAnswers.map((item) => (
                <div
                  key={item.wordId}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-text-primary">
                    Правильно: <span className="text-accent">{item.word}</span>
                  </p>
                  <p className="mt-1 text-text-secondary">
                    Ваш ответ:{" "}
                    <span className="text-red-400">{item.userAnswer || "—"}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.passed && !compact && (
            <p className="mt-4 text-sm text-text-muted">
              Верные ответы автоматически добавлены в выученные.
            </p>
          )}

          {!result.passed && !state.completedToday && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startStudy}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-5 py-2.5 text-sm font-semibold text-text-primary hover:border-accent/30 hover:text-accent"
              >
                <BookOpen className="h-4 w-4" />
                Выучить ещё раз
              </button>
              <button
                type="button"
                onClick={retryQuiz}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                <RotateCcw className="h-4 w-4" />
                Пройти ещё раз
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Link href="/hard-words#daily" className="mb-6 block transition-opacity hover:opacity-95">
        {card}
      </Link>
    );
  }

  return card;
}
