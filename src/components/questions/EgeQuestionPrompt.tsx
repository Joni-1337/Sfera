import { splitEgeQuestionDisplay } from "@/lib/ege-prompt";

export function EgeQuestionPrompt({ prompt }: { prompt: string }) {
  const { instruction, context } = splitEgeQuestionDisplay(prompt);

  return (
    <div className="mb-4 space-y-4">
      <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-text-primary">
        {instruction}
      </div>

      {context && (
        <div className="space-y-2 border-t border-border/70 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Текст
          </p>
          <div className="rounded-xl border border-border/60 bg-bg-elevated/40 px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {context}
          </div>
        </div>
      )}
    </div>
  );
}
