"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQuestionLabel } from "@/lib/ege-prompt";
import {
  QuestionReviewCard,
  type QuestionReviewData,
} from "@/components/assignments/QuestionReviewCard";

export function QuestionReviewAccordionList({
  questions,
  chosenByQuestionId,
}: {
  questions: QuestionReviewData[];
  chosenByQuestionId?: Map<string, string | null>;
}) {
  const [openId, setOpenId] = useState<string | null>(questions[0]?.id ?? null);

  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
        Вопросов пока нет
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {questions.map((question, index) => {
        const label = formatQuestionLabel(question.prompt, index + 1);
        const open = openId === question.id;
        const chosenOption = chosenByQuestionId?.get(question.id) ?? null;

        return (
          <div
            key={question.id}
            className="overflow-hidden rounded-xl border border-border bg-bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : question.id)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-elevated/40"
            >
              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-teal-200">
                #{label.number}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-snug text-text-primary">
                {label.text}
              </span>
              <ChevronDown
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-text-secondary transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open && (
              <div className="border-t border-border px-4 pb-4 pt-2">
                <QuestionReviewCard
                  question={{ ...question, prompt: label.text }}
                  index={index}
                  chosenOption={chosenOption}
                  compact
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
