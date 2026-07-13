import { generateExcelTemplate } from "@/lib/excel-import";

export async function GET() {
  const buffer = generateExcelTemplate();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="shablon-voprosov.xlsx"',
    },
  });
}
