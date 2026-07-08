"use client";

import Link from "next/link";
import { Check, X, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { questionTypeLabel } from "@/lib/scoring";
import { getOptionText } from "@/lib/question-options";

type Answer = {
  chosenOption: string;
  isCorrect: boolean;
  question: {
    type: string;
    prompt: string;
    answerOptions?: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    explanation: string;
  };
};

export function AssignmentResultView({
  title,
  score,
  maxScore,
  attemptNumber,
  allowRetake,
  assignmentId,
  answers,
}: {
  title: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  allowRetake: boolean;
  assignmentId: string;
  answers: Answer[];
}) {
  const pct = Math.round((score / maxScore) * 100);

  const formatAnswer = (q: Answer["question"], key: string) => {
    if (q.type === "multiple_choice") {
      return `${key}. ${getOptionText(q, key)}`;
    }
    return key;
  };

  return (
    <div>
      <Link href="/tasks" className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent">
        <ArrowLeft className="h-4 w-4" />
        К заданиям
      </Link>

      <div className="mb-8 rounded-2xl border border-border bg-bg-card p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        {attemptNumber > 1 && (
          <p className="mb-2 text-sm text-text-muted">Попытка #{attemptNumber}</p>
        )}
        <p className="text-4xl font-bold text-accent">{score}/{maxScore}</p>
        <p className="mt-1 text-text-secondary">{pct}% правильных ответов</p>
        {allowRetake && (
          <Link
            href={`/tasks/${assignmentId}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent/30 px-4 py-2 text-sm text-accent hover:bg-accent/10"
          >
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </Link>
        )}
      </div>

      <div className="max-w-2xl space-y-4">
        {answers.map((ans, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border p-4",
              ans.isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
            )}
          >
            <div className="mb-2 flex items-start gap-2">
              {ans.isCorrect ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              )}
              <div>
                <p className="text-xs text-text-muted">{questionTypeLabel(ans.question.type)}</p>
                <p className="text-sm">{ans.question.prompt}</p>
              </div>
            </div>
            {!ans.isCorrect && (
              <div className="ml-6 space-y-1 text-xs text-text-muted">
                <p>
                  Ваш ответ:{" "}
                  <span className="text-red-400">
                    {formatAnswer(ans.question, ans.chosenOption)}
                  </span>
                </p>
                <p>
                  Правильно:{" "}
                  <span className="text-green-400">
                    {formatAnswer(ans.question, ans.question.correctOption)}
                  </span>
                </p>
              </div>
            )}
            {ans.question.explanation && !ans.isCorrect && (
              <p className="ml-6 mt-2 text-xs text-text-secondary">{ans.question.explanation}</p>
            )}
          </div>
        ))}
      </div>

      <Link href="/results" className="mt-8 inline-block text-sm text-accent hover:underline">
        Посмотреть все результаты →
      </Link>
    </div>
  );
}
