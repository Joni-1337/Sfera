import { formatDateTime, RESULT_CATEGORIES } from "@/lib/utils";

export type ExportResultRow = {
  studentName: string;
  groupName: string;
  category: string;
  taskName: string;
  score: number;
  maxScore: number;
  completedAt: Date | string;
};

function escapeCsvField(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function categoryLabel(categoryId: string) {
  return (
    RESULT_CATEGORIES.find((c) => c.id === categoryId)?.label.split(" (")[0] ?? categoryId
  );
}

export function buildResultsCsv(rows: ExportResultRow[]): string {
  const headers = [
    "Ученик",
    "Группа",
    "Категория",
    "Задание",
    "Баллы",
    "Макс. балл",
    "Процент",
    "Дата",
  ];

  const lines = [
    headers.join(";"),
    ...rows.map((row) => {
      const percent =
        row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0;
      return [
        escapeCsvField(row.studentName),
        escapeCsvField(row.groupName),
        escapeCsvField(categoryLabel(row.category)),
        escapeCsvField(row.taskName),
        String(row.score),
        String(row.maxScore),
        String(percent),
        escapeCsvField(formatDateTime(row.completedAt)),
      ].join(";");
    }),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
