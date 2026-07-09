import { QuestionReviewCard, type QuestionReviewData } from "@/components/assignments/QuestionReviewCard";

export type AssignmentQuestionPreview = QuestionReviewData;

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
      {questions.map((question, index) => (
        <QuestionReviewCard key={question.id} question={question} index={index} />
      ))}
    </div>
  );
}
