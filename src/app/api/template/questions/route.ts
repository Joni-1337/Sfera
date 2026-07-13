import { generateExcelTemplate } from "@/lib/excel-template-export";

export async function GET() {
  const buffer = await generateExcelTemplate();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="shablon-voprosov.xlsx"',
    },
  });
}
