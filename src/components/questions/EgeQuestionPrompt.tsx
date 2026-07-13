import { parseEgeQuestionParts } from "@/lib/ege-prompt";

function SectionDivider() {
  return <div className="border-t border-border/80" />;
}

export function EgeQuestionPrompt({ prompt }: { prompt: string }) {
  const { reference, question, options, context } = parseEgeQuestionParts(prompt);

  return (
    <div className="mb-4 space-y-4">
      {reference && (
        <p className="text-sm leading-relaxed text-text-primary/85">{reference}</p>
      )}

      {question && (
        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-text-primary">
          {question}
        </p>
      )}

      {options && (
        <div className="space-y-3 pt-1">
          <SectionDivider />
          <div className="whitespace-pre-wrap pt-3 text-sm leading-relaxed text-text-primary">
            {options}
          </div>
        </div>
      )}

      {context && (
        <div className="space-y-3 pt-1">
          <SectionDivider />
          <p className="pt-1 text-xs font-medium uppercase tracking-wide text-text-primary/70">
            Текст
          </p>
          <div className="rounded-xl border border-border/60 bg-bg-elevated/50 px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary/95">
            {context}
          </div>
        </div>
      )}
    </div>
  );
}
