import { NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildResultsCsv } from "@/lib/export-results";

export async function GET(request: NextRequest) {
  const session = await requireTeacher();
  if (!session) {
    return new Response("Необходима авторизация преподавателя", { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get("groupId")?.trim() || undefined;
  const category = request.nextUrl.searchParams.get("category")?.trim() || undefined;

  if (groupId) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, teacherId: session.id },
    });
    if (!group) {
      return new Response("Группа не найдена", { status: 404 });
    }
  }

  const groups = await prisma.group.findMany({
    where: {
      teacherId: session.id,
      archived: false,
      ...(groupId ? { id: groupId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      students: {
        include: {
          results: {
            ...(category ? { where: { category } } : {}),
            orderBy: { completedAt: "desc" },
          },
        },
      },
    },
  });

  const rows = groups.flatMap((group) =>
    group.students.flatMap((student) =>
      student.results.map((result) => ({
        studentName: student.fullName,
        groupName: group.name,
        category: result.category,
        taskName: result.taskName,
        score: result.score,
        maxScore: result.maxScore,
        completedAt: result.completedAt,
      }))
    )
  );

  const csv = buildResultsCsv(rows);
  const filename = groupId ? `results-${groupId}.csv` : "results-all.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
