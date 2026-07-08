export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export function normalizeTextContent(value: string): string {
  return normalizeLineEndings(value).replace(/^\n+/, "").replace(/\n+$/, "");
}
