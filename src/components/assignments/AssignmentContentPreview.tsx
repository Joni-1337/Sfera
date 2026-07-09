import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { questionTypeLabel } from "@/lib/scoring";
import { getChoiceOptions, getOptionText } from "@/lib/question-options";

export type AssignmentQuestionPreview = {
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

export function AssignmentContentPreview({
  questions,
}: {
  questions: AssignmentQuestionPreview[];
}) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
        В задании пока нет вопросов
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const options = getChoiceOptions(question);
        const correctKey = question.correctOption.trim().toUpperCase();
        const correctText = getOptionText(question, correctKey);

        return (
          <article
            key={question.id}
            className="rounded-2xl border border-border bg-bg-card p-5"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-teal-200">
                Вопрос {index + 1}
              </span>
              <span className="text-xs text-text-muted">
                {questionTypeLabel(question.type)}
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-text-primary">
              {question.prompt}
            </p>

            {options.length > 0 ? (
              <ul className="space-y-2">
                {options.map((option) => {
                  const isCorrect = option.key === correctKey;
                  return (
                    <li
                      key={option.key}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
                        isCorrect
                          ? "border-accent/40 bg-accent/10"
                          : "border-border bg-bg-elevated/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                          isCorrect
                            ? "bg-accent text-white"
                            : "bg-bg-elevated text-text-secondary"
                        )}
                      >
                        {option.key}
                      </span>
                      <span className={isCorrect ? "text-teal-100" : "text-text-secondary"}>
                        {option.text}
                      </span>
                      {isCorrect && (
                        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-teal-300" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-border bg-bg-elevated/50 px-3 py-2 text-sm text-text-secondary">
                Правильный ответ:{" "}
                <span className="font-medium text-teal-200">{question.correctOption}</span>
              </p>
            )}

            <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5 text-sm">
              <p className="font-medium text-teal-200">
                Правильный ответ: {correctKey}
                {correctText && correctText !== correctKey ? ` — ${correctText}` : ""}
              </p>
              {question.explanation && (
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {question.explanation}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
