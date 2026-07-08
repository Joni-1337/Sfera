import { generateHardWordsTemplate } from "@/lib/hard-words-import";

export async function GET() {
  const buffer = generateHardWordsTemplate();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="shablon-slovarya.xlsx"',
    },
  });
}
