"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { resolveTestVariantLabel } from "@/lib/test-templates";
import {
  QuestionReviewCard,
  type QuestionReviewData,
} from "@/components/assignments/QuestionReviewCard";

type ResultAnswer = {
  chosenOption: string;
  isCorrect: boolean;
  question: QuestionReviewData & { id?: string; orderIndex?: number };
};

export function TestResultView({
  title,
  score,
  maxScore,
  attemptNumber,
  allowRetake,
  testId,
  egeVariantNumber,
  answers,
}: {
  title: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  allowRetake: boolean;
  testId: string;
  egeVariantNumber?: number | null;
  answers: ResultAnswer[];
}) {
  const pct = Math.round((score / maxScore) * 100);
  const variantLabel = resolveTestVariantLabel(
    egeVariantNumber,
    answers.map((a) => a.question)
  );

  return (
    <div>
      <Link
        href="/tests"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        К тестам
      </Link>

      <div className="mb-8 rounded-2xl border border-border bg-bg-card p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        {variantLabel && (
          <p className="mb-2 text-sm font-medium text-teal-200">{variantLabel}</p>
        )}
        {attemptNumber > 1 && (
          <p className="mb-2 text-sm text-text-secondary">Попытка #{attemptNumber}</p>
        )}
        <p className="text-4xl font-bold text-accent">
          {score}/{maxScore}
        </p>
        <p className="mt-1 text-text-secondary">{pct}% правильных ответов</p>
        {allowRetake && (
          <Link
            href={`/tests/${testId}/take`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent/30 px-4 py-2 text-sm text-accent hover:bg-accent/10"
          >
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </Link>
        )}
      </div>

      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold">Разбор ответов</h2>
        <p className="text-sm text-text-secondary">
          Все варианты ответа — как при решении. Правильный выделен бирюзовым.
        </p>
        {answers.map((ans, index) => (
          <QuestionReviewCard
            key={ans.question.id ?? index}
            question={{
              ...ans.question,
              id: ans.question.id ?? String(index),
              orderIndex: ans.question.orderIndex ?? index,
            }}
            index={index}
            chosenOption={ans.chosenOption}
            compact
          />
        ))}
      </div>
    </div>
  );
}
