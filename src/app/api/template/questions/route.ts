import fs from "fs";
import path from "path";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "templates",
  "excel-bank",
  "advanced_questions_bank.xlsx"
);

export async function GET() {
  const buffer = fs.readFileSync(TEMPLATE_PATH);
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="shablon-voprosov.xlsx"',
    },
  });
}
