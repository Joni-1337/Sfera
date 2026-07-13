import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkAnswer, formatCorrectAnswerDisplay, questionTypeLabel } from "@/lib/scoring";
import { getChoiceOptions, parseMultipleChoiceCorrect } from "@/lib/question-options";
import { EgeQuestionPrompt } from "@/components/questions/EgeQuestionPrompt";

export type QuestionReviewData = {
  id: string;
  orderIndex: number;
  type: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answerOptions?: string;
  correctOption: string;
  explanation: string;
};

export function QuestionReviewCard({
  question,
  index,
  chosenOption,
  compact = false,
}: {
  question: QuestionReviewData;
  index: number;
  chosenOption?: string | null;
  compact?: boolean;
}) {
  const options = getChoiceOptions(question);
  const correctKeys = new Set(parseMultipleChoiceCorrect(question.correctOption));
  const chosenKey = chosenOption?.trim().toUpperCase() ?? "";
  const hasStudentAnswer = Boolean(chosenOption?.trim());
  const isCorrect =
    hasStudentAnswer &&
    checkAnswer(question.type, chosenOption ?? "", question.correctOption);
  const correctAnswerLabel = formatCorrectAnswerDisplay(
    question.type,
    question.correctOption,
    question
  );

  return (
    <article
      className={cn(
        "rounded-2xl border bg-bg-card",
        compact ? "p-4" : "p-5",
        hasStudentAnswer && !isCorrect
          ? "border-red-500/30"
          : hasStudentAnswer && isCorrect
            ? "border-accent/30"
            : "border-border"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-teal-200">
          #{question.orderIndex + 1}
        </span>
        <span className="text-xs text-text-secondary">
          {questionTypeLabel(question.type)}
        </span>
        {hasStudentAnswer && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isCorrect ? "badge-published" : "badge-status-error"
            )}
          >
            {isCorrect ? "Верно" : "Ошибка"}
          </span>
        )}
      </div>

      <EgeQuestionPrompt prompt={question.prompt} />

      {options.length > 0 ? (
        <ul className="space-y-2">
          {options.map((option) => {
            const isCorrectOption = correctKeys.has(option.key);
            const isChosen = option.key === chosenKey;
            const isWrongChoice = isChosen && !isCorrectOption;

            return (
              <li
                key={option.key}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  isCorrectOption
                    ? "border-accent/45 bg-accent/12"
                    : isWrongChoice
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-border bg-bg-elevated/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                    isCorrectOption
                      ? "bg-accent text-white"
                      : isWrongChoice
                        ? "bg-red-500 text-white"
                        : "bg-bg-elevated text-text-primary"
                  )}
                >
                  {option.key}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words",
                    isCorrectOption
                      ? "font-medium text-teal-100"
                      : isWrongChoice
                        ? "font-medium text-red-100"
                        : "text-text-secondary"
                  )}
                >
                  {option.text}
                </span>
                {isCorrectOption && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300" />
                )}
                {isWrongChoice && (
                  <XCircle className="h-4 w-4 shrink-0 text-red-300" />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-2 rounded-xl border border-border bg-bg-elevated/50 px-3 py-2.5 text-sm">
          {hasStudentAnswer && (
            <p>
              <span className="text-text-secondary">Ответ ученика: </span>
              <span className={isCorrect ? "text-teal-200" : "text-red-200"}>
                {chosenOption || "—"}
              </span>
            </p>
          )}
          <p>
            <span className="text-text-secondary">Правильный ответ: </span>
            <span className="font-medium text-teal-100">{correctAnswerLabel}</span>
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-sm">
        <p className="font-medium text-teal-100">
          Правильный ответ: {correctAnswerLabel}
        </p>
        {hasStudentAnswer && !isCorrect && (
          <p className="mt-1 text-red-200">
            Выбрал ученик: {chosenOption?.trim() || "—"}
          </p>
        )}
        {question.explanation && (
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            {question.explanation}
          </p>
        )}
      </div>
    </article>
  );
}

export function errorRateBadgeClass(pct: number) {
  if (pct > 50) return "badge-status-error";
  if (pct > 0) return "badge-status-warn";
  return "badge-status-ok";
}
