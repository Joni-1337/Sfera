function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function trimContentEdges(value: string): string {
  return normalizeLineEndings(value).replace(/^\n+/, "").replace(/\n+$/, "");
}

export function FormattedTextContent({ content }: { content: string }) {
  const normalized = trimContentEdges(content);
  const paragraphs = normalized.split(/\n{2,}/);

  return (
    <div className="space-y-4 text-base leading-relaxed text-text-secondary">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap break-words [tab-size:4]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
