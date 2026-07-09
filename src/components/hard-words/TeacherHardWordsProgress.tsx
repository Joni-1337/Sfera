"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { Collapsible, chevronClass } from "@/components/ui/Collapsible";
import { streakLabel } from "@/lib/daily-words-shared";

export type StudentHardWordProgress = {
  id: string;
  fullName: string;
  groupName: string;
  learnedCount: number;
  totalWords: number;
  streak: number;
  lastActivity: Date | null;
};

type GroupProgress = {
  name: string;
  students: StudentHardWordProgress[];
  avgLearned: number;
  activeCount: number;
};

function groupStudents(students: StudentHardWordProgress[]): GroupProgress[] {
  const map = new Map<string, StudentHardWordProgress[]>();

  for (const student of students) {
    const list = map.get(student.groupName) ?? [];
    list.push(student);
    map.set(student.groupName, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([name, groupStudents]) => {
      const totalLearned = groupStudents.reduce((sum, s) => sum + s.learnedCount, 0);
      const activeCount = groupStudents.filter((s) => s.learnedCount > 0).length;

      return {
        name,
        students: groupStudents,
        avgLearned: groupStudents.length
          ? Math.round(totalLearned / groupStudents.length)
          : 0,
        activeCount,
      };
    });
}

function studentWord(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return "ученик";
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return "ученика";
  }
  return "учеников";
}

function GroupProgressCard({
  group,
  totalWords,
}: {
  group: GroupProgress;
  totalWords: number;
}) {
  const [open, setOpen] = useState(false);
  const { students, name, avgLearned, activeCount } = group;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50 sm:px-5"
      >
        <ChevronDown
          className={chevronClass(open, "mt-1 h-4 w-4 shrink-0 text-text-muted")}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{name}</h3>
          <p className="mt-1 text-xs text-text-muted">
            {students.length} {studentWord(students.length)}
            {" · "}
            в среднем {avgLearned} / {totalWords} слов
            {" · "}
            активны {activeCount} из {students.length}
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm font-medium text-accent">
            {avgLearned} / {totalWords}
          </p>
          <p className="text-xs text-text-muted">в среднем</p>
        </div>
      </button>

      <Collapsible open={open}>
        <div className="border-t border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Ученик</th>
                <th className="px-5 py-3">Выучено</th>
                <th className="px-5 py-3">Серия</th>
                <th className="px-5 py-3">Последняя активность</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border/50 transition-colors last:border-b-0 hover:bg-bg-elevated/50"
                >
                  <td className="px-5 py-3.5 text-sm font-medium">{student.fullName}</td>
                  <td className="px-5 py-3.5 text-sm">
                    {student.learnedCount} / {student.totalWords}
                  </td>
                  <td className="px-5 py-3.5 text-sm">{streakLabel(student.streak)}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {student.lastActivity ? formatDateTime(student.lastActivity) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>
    </div>
  );
}

export function TeacherHardWordsProgress({
  students,
  totalWords,
}: {
  students: StudentHardWordProgress[];
  totalWords: number;
}) {
  const groups = useMemo(() => groupStudents(students), [students]);

  if (totalWords === 0) {
    return (
      <section className="mb-10">
        <h2 className="mb-2 text-lg font-semibold">Прогресс учеников</h2>
        <p className="text-sm text-text-muted">
          Добавьте слова в словарь, чтобы отслеживать прогресс учеников.
        </p>
      </section>
    );
  }

  if (students.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="mb-2 text-lg font-semibold">Прогресс учеников</h2>
        <p className="text-sm text-text-muted">В ваших группах пока нет учеников.</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="mb-2 text-lg font-semibold">Прогресс учеников</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Выученные слова из вашего словаря · всего слов: {totalWords} · групп:{" "}
        {groups.length}
      </p>

      <div className="space-y-3">
        {groups.map((group) => (
          <GroupProgressCard key={group.name} group={group} totalWords={totalWords} />
        ))}
      </div>
    </section>
  );
}
