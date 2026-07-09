import { BarChart3, BookMarked, ClipboardList, Flame, FlaskConical } from "lucide-react";

export function StudentProgressCard({
  completedAssignments,
  completedTests,
  learnedWords,
  wordStreak,
  wordStreakBest,
}: {
  completedAssignments: number;
  completedTests: number;
  learnedWords: number;
  wordStreak: number;
  wordStreakBest: number;
}) {
  const stats = [
    {
      label: "Задания",
      value: completedAssignments,
      icon: ClipboardList,
    },
    {
      label: "Тесты",
      value: completedTests,
      icon: FlaskConical,
    },
    {
      label: "Слова",
      value: learnedWords,
      icon: BookMarked,
    },
    {
      label: "Серия",
      value: wordStreak,
      hint: wordStreakBest > 0 ? `рекорд ${wordStreakBest}` : undefined,
      icon: Flame,
    },
  ];

  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/5 to-bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Ваш прогресс</h2>
          <p className="text-sm text-text-secondary">Сдано и выучено на платформе</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border/80 bg-bg-elevated/60 px-3 py-3"
          >
            <dt className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
            {hint ? <p className="mt-0.5 text-[10px] text-text-muted">{hint}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
