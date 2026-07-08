"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Candy,
  SlidersHorizontal,
  X,
  BookMarked,
  ClipboardList,
  FlaskConical,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Users,
  Download,
} from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { DailyWordChallenge } from "@/components/hard-words/DailyWordChallenge";
import type { DailyWordState } from "@/lib/daily-words-shared";
import { formatDate, formatDateTime, RESULT_CATEGORIES } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  category: string;
  taskName: string;
  score: number;
  maxScore: number;
  completedAt: Date | string;
  studentName?: string;
  detailHref?: string | null;
};

type GroupResults = {
  id: string;
  name: string;
  results: Result[];
};

const TEST_CATEGORY = "ege-tests";

const CATEGORY_SHORT: Record<string, string> = {
  orthography: "Орфография",
  "ege-tests": "Тест ЕГЭ",
  "hard-words": "Сложные слова",
  "task-9": "Задание 9",
  adverbs: "Наречия",
  "task-4": "Задание 4",
  "task-22": "Задание 22",
  "task-21": "Задание 21",
  "task-7-8": "Задания 7–8",
};

function filterByDate(results: Result[], dateFrom: string, dateTo: string) {
  return results.filter((r) => {
    const date = new Date(r.completedAt);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });
}

function getAssignmentTitle(taskName: string) {
  return taskName.replace(/\s*\(попытка\s+\d+\)\s*$/i, "").trim();
}

function getAttemptNumber(taskName: string) {
  const match = taskName.match(/\(попытка\s+(\d+)\)\s*$/i);
  return match ? Number(match[1]) : 1;
}

function isTestResult(result: Result) {
  return result.category === TEST_CATEGORY;
}

function getCategoryLabel(categoryId: string) {
  return (
    CATEGORY_SHORT[categoryId] ??
    RESULT_CATEGORIES.find((c) => c.id === categoryId)?.label.split(" (")[0] ??
    categoryId
  );
}

function getScorePercent(score: number, maxScore: number) {
  if (!maxScore) return 0;
  return Math.round((score / maxScore) * 100);
}

function getScoreTone(percent: number) {
  if (percent >= 80) return "good" as const;
  if (percent >= 50) return "mid" as const;
  return "low" as const;
}

const SCORE_TONE_STYLES = {
  good: "bg-green-500/15 text-green-400 border-green-500/20",
  mid: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  low: "bg-red-500/15 text-red-400 border-red-500/20",
};

function groupResultsByAssignment(results: Result[]) {
  const map = new Map<string, Result[]>();

  for (const result of results) {
    const title = getAssignmentTitle(result.taskName);
    const list = map.get(title) ?? [];
    list.push(result);
    map.set(title, list);
  }

  return Array.from(map.entries())
    .map(([title, assignmentResults]) => ({
      title,
      results: assignmentResults.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }))
    .sort((a, b) => {
      const latestA = a.results[0]?.completedAt ?? 0;
      const latestB = b.results[0]?.completedAt ?? 0;
      return new Date(latestB).getTime() - new Date(latestA).getTime();
    });
}

function groupResultsByStudent(results: Result[]) {
  const map = new Map<string, Result[]>();

  for (const result of results) {
    const name = result.studentName?.trim() || "Без имени";
    const list = map.get(name) ?? [];
    list.push(result);
    map.set(name, list);
  }

  return Array.from(map.entries())
    .map(([studentName, attempts]) => ({
      studentName,
      attempts: attempts.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ru"));
}

function countUniqueStudents(results: Result[]) {
  return new Set(results.map((r) => r.studentName?.trim() || "Без имени")).size;
}

function computeSummary(results: Result[]) {
  if (results.length === 0) {
    return { count: 0, avgPercent: 0, bestPercent: 0, lastActivity: null as Date | null };
  }

  const percents = results.map((r) => getScorePercent(r.score, r.maxScore));
  const avgPercent = Math.round(
    percents.reduce((sum, value) => sum + value, 0) / percents.length
  );

  return {
    count: results.length,
    avgPercent,
    bestPercent: Math.max(...percents),
    lastActivity: new Date(results[0].completedAt),
  };
}

export function ResultsView({
  results = [],
  groups = [],
  role,
  categoryFilter,
  dailyState,
}: {
  results?: Result[];
  groups?: GroupResults[];
  studentName: string;
  role: "teacher" | "student";
  categoryFilter?: string;
  dailyState?: DailyWordState | null;
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const router = useRouter();

  const activeFilterCount =
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (selectedGroupId ? 1 : 0);

  const filteredResults = useMemo(
    () => filterByDate(results, dateFrom, dateTo),
    [results, dateFrom, dateTo]
  );

  const filteredGroups = useMemo(
    () =>
      groups
        .filter((group) => !selectedGroupId || group.id === selectedGroupId)
        .map((group) => ({
          ...group,
          results: filterByDate(group.results, dateFrom, dateTo),
        })),
    [groups, dateFrom, dateTo, selectedGroupId]
  );

  const allTeacherResults = useMemo(
    () => filteredGroups.flatMap((group) => group.results),
    [filteredGroups]
  );

  const displayResults = role === "student" ? filteredResults : allTeacherResults;
  const summary = useMemo(() => computeSummary(displayResults), [displayResults]);

  const studentTests = useMemo(
    () => filteredResults.filter(isTestResult),
    [filteredResults]
  );
  const studentAssignments = useMemo(
    () => filteredResults.filter((r) => !isTestResult(r)),
    [filteredResults]
  );

  const categoryLabel = categoryFilter
    ? RESULT_CATEGORIES.find((c) => c.id === categoryFilter)?.label
    : null;

  function resetFilters() {
    setDateFrom("");
    setDateTo("");
    setSelectedGroupId("");
    if (categoryFilter) router.push("/results");
  }

  function buildExportHref() {
    const params = new URLSearchParams();
    if (selectedGroupId) params.set("groupId", selectedGroupId);
    if (categoryFilter) params.set("category", categoryFilter);
    const query = params.toString();
    return query ? `/api/export/results?${query}` : "/api/export/results";
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div>
      <h1 className="mb-3 text-3xl font-bold">
        {role === "teacher" ? "Результаты учеников" : "Мои результаты"}
      </h1>

      {role === "student" && dailyState && dailyState.totalWords > 0 && (
        <DailyWordChallenge state={dailyState} compact />
      )}

      {role === "student" && (!dailyState || dailyState.totalWords === 0) && (
        <Link
          href="/hard-words"
          className="mb-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <Candy className="h-4 w-4" />
          Словарь — незабываем повторять
        </Link>
      )}

      {role === "teacher" && (
        <Link
          href="/hard-words"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <BookMarked className="h-4 w-4" />
          Словарь сложных слов — добавить и редактировать
        </Link>
      )}

      <p className="mb-4 max-w-2xl text-sm text-text-secondary">
        {role === "teacher"
          ? "Группы свёрнуты — разверните нужную. Нажмите на задание или тест, чтобы увидеть детали."
          : "Результаты разделены на тесты и задания. Нажмите на карточку, чтобы развернуть попытки."}
      </p>

      {displayResults.length > 0 && (
        <ResultsSummary summary={summary} />
      )}

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
              filterOpen || activeFilterCount > 0
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border text-text-secondary hover:border-accent/30 hover:text-accent"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтр
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {role === "teacher" && (
            <a
              href={buildExportHref()}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
            >
              <Download className="h-4 w-4" />
              Экспорт CSV
            </a>
          )}
        </div>

        {activeFilterCount > 0 && !filterOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {categoryLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                {categoryLabel.split(" (")[0]}
                <Link href="/results" className="hover:text-white">
                  <X className="h-3 w-3" />
                </Link>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                с {dateFrom}
                <button type="button" onClick={() => setDateFrom("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                по {dateTo}
                <button type="button" onClick={() => setDateTo("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedGroupId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                {groups.find((g) => g.id === selectedGroupId)?.name ?? "Группа"}
                <button type="button" onClick={() => setSelectedGroupId("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {filterOpen && (
          <div className="mt-3 rounded-2xl border border-border bg-bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Фильтры</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-text-muted hover:text-accent"
                >
                  Сбросить всё
                </button>
              )}
            </div>

            <div className="space-y-4">
              {role === "teacher" && groups.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-text-muted">Группа</p>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                  >
                    <option value="">Все группы</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs text-text-muted">Категория</p>
                <CategoryFilter current={categoryFilter} compact />
              </div>

              <div>
                <p className="mb-2 text-xs text-text-muted">Период</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      aria-label="Дата с"
                      className="w-[130px] rounded-lg border border-border bg-bg-elevated py-1.5 pl-2 pr-7 text-xs outline-none focus:border-accent sm:w-[140px]"
                    />
                    <Calendar className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
                  </div>
                  <span className="text-xs text-text-muted">—</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      aria-label="Дата по"
                      className="w-[130px] rounded-lg border border-border bg-bg-elevated py-1.5 pl-2 pr-7 text-xs outline-none focus:border-accent sm:w-[140px]"
                    />
                    <Calendar className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={clearDates}
                      className="text-xs text-text-muted hover:text-accent"
                    >
                      Очистить даты
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {role === "teacher" ? (
        <TeacherResultsByGroup groups={filteredGroups} />
      ) : (
        <StudentResultsSections tests={studentTests} assignments={studentAssignments} />
      )}
    </div>
  );
}

function ResultsSummary({
  summary,
}: {
  summary: ReturnType<typeof computeSummary>;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Сводка</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={BarChart3}
          label="Всего попыток"
          value={String(summary.count)}
          sub={
            summary.lastActivity
              ? `Последняя активность: ${formatDate(summary.lastActivity)}`
              : undefined
          }
        />
        <SummaryCard
          icon={TrendingUp}
          label="Средний результат"
          value={`${summary.avgPercent}%`}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Лучший результат"
          value={`${summary.bestPercent}%`}
        />
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function StudentResultsSections({
  tests,
  assignments,
}: {
  tests: Result[];
  assignments: Result[];
}) {
  if (tests.length === 0 && assignments.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div className="space-y-8">
      {tests.length > 0 && (
        <ResultsSection
          title="Тесты"
          icon={FlaskConical}
          count={tests.length}
          results={tests}
          groupByStudent={false}
        />
      )}
      {assignments.length > 0 && (
        <ResultsSection
          title="Задания"
          icon={ClipboardList}
          count={assignments.length}
          results={assignments}
          groupByStudent={false}
        />
      )}
    </div>
  );
}

function TeacherResultsByGroup({ groups }: { groups: GroupResults[] }) {
  const nonEmpty = groups.filter((g) => g.results.length > 0);

  if (nonEmpty.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div className="space-y-3">
      {nonEmpty.map((group) => {
        const tests = group.results.filter(isTestResult);
        const assignments = group.results.filter((r) => !isTestResult(r));
        const studentCount = countUniqueStudents(group.results);

        return (
          <Accordion
            key={group.id}
            title={group.name}
            count={group.results.length}
            defaultOpen={false}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {studentCount}{" "}
                {studentCount === 1 ? "ученик" : studentCount < 5 ? "ученика" : "учеников"}
              </span>
              <span>
                {group.results.length}{" "}
                {group.results.length === 1
                  ? "попытка"
                  : group.results.length < 5
                    ? "попытки"
                    : "попыток"}
              </span>
            </div>

            <div className="space-y-6">
              {tests.length > 0 && (
                <ResultsSection
                  title="Тесты"
                  icon={FlaskConical}
                  count={tests.length}
                  results={tests}
                  groupByStudent
                  nested
                />
              )}
              {assignments.length > 0 && (
                <ResultsSection
                  title="Задания"
                  icon={ClipboardList}
                  count={assignments.length}
                  results={assignments}
                  groupByStudent
                  nested
                />
              )}
            </div>
          </Accordion>
        );
      })}
    </div>
  );
}

function ResultsSection({
  title,
  icon: Icon,
  count,
  results,
  groupByStudent = false,
  nested = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  results: Result[];
  groupByStudent?: boolean;
  nested?: boolean;
}) {
  const groups = groupResultsByAssignment(results);

  return (
    <div>
      {!nested && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Icon className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
            {count}
          </span>
        </div>
      )}

      {nested && (
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
          <span className="text-xs text-text-muted">({count})</span>
        </div>
      )}

      <div className="space-y-3">
        {groups.map(({ title: assignmentTitle, results: attemptResults }) => (
          <ResultGroupCard
            key={assignmentTitle}
            title={assignmentTitle}
            results={attemptResults}
            groupByStudent={groupByStudent}
          />
        ))}
      </div>
    </div>
  );
}

function ResultGroupCard({
  title,
  results,
  groupByStudent,
}: {
  title: string;
  results: Result[];
  groupByStudent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sample = results[0];
  const isTest = isTestResult(sample);
  const studentGroups = groupByStudent ? groupResultsByStudent(results) : [];
  const best = results.reduce((current, item) => {
    const currentPercent = getScorePercent(current.score, current.maxScore);
    const itemPercent = getScorePercent(item.score, item.maxScore);
    return itemPercent > currentPercent ? item : current;
  }, results[0]);
  const bestPercent = getScorePercent(best.score, best.maxScore);

  const summary = groupByStudent ? (
    <>
      {studentGroups.length}{" "}
      {studentGroups.length === 1
        ? "ученик"
        : studentGroups.length < 5
          ? "ученика"
          : "учеников"}
      {" · "}
      {results.length}{" "}
      {results.length === 1 ? "попытка" : results.length < 5 ? "попытки" : "попыток"}
    </>
  ) : (
    <>
      {results.length}{" "}
      {results.length === 1 ? "попытка" : results.length < 5 ? "попытки" : "попыток"}
    </>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50 sm:px-5"
      >
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge isTest={isTest} />
            <CategoryBadge category={sample.category} />
          </div>
          <h3 className="mt-2 text-base font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-text-muted">
            {summary}
            {" · "}
            лучший результат {best.score}/{best.maxScore} ({bestPercent}%)
          </p>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {groupByStudent
            ? studentGroups.map(({ studentName, attempts }) => (
                <StudentAttemptsRow
                  key={studentName}
                  studentName={studentName}
                  attempts={attempts}
                />
              ))
            : results.map((result) => (
                <ResultRow key={result.id} result={result} compact={false} />
              ))}
        </ul>
      )}
    </div>
  );
}

function StudentAttemptsRow({
  studentName,
  attempts,
}: {
  studentName: string;
  attempts: Result[];
}) {
  const [open, setOpen] = useState(false);
  const best = attempts.reduce((current, item) => {
    const currentPercent = getScorePercent(current.score, current.maxScore);
    const itemPercent = getScorePercent(item.score, item.maxScore);
    return itemPercent > currentPercent ? item : current;
  }, attempts[0]);
  const latest = attempts[0];
  const bestPercent = getScorePercent(best.score, best.maxScore);
  const displayPercent = bestPercent;
  const displayScore = best;
  const tone = getScoreTone(displayPercent);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/70 sm:px-5"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-accent">{studentName}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {attempts.length}{" "}
            {attempts.length === 1 ? "попытка" : attempts.length < 5 ? "попытки" : "попыток"}
            {" · "}
            последняя {formatDateTime(latest.completedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] text-text-muted">лучший</p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold",
                SCORE_TONE_STYLES[tone]
              )}
            >
              {displayScore.score}/{displayScore.maxScore}
            </span>
            <p className="mt-0.5 text-xs text-text-muted">{displayPercent}%</p>
          </div>
        </div>
      </button>

      {open && (
        <ul className="border-t border-border bg-bg-elevated/40">
          {attempts.map((result) => (
            <ResultRow key={result.id} result={result} compact />
          ))}
        </ul>
      )}
    </li>
  );
}

function ResultRow({
  result,
  compact = false,
}: {
  result: Result;
  compact?: boolean;
}) {
  const percent = getScorePercent(result.score, result.maxScore);
  const tone = getScoreTone(percent);
  const attemptNumber = getAttemptNumber(result.taskName);
  const content = (
    <>
      <div className={cn("min-w-0 flex-1", compact && "pl-7")}>
        <span className="text-sm font-medium">Попытка {attemptNumber}</span>
        <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(result.completedAt)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-border sm:block sm:w-20">
          <div
            className={cn(
              "h-full rounded-full",
              tone === "good" && "bg-green-400",
              tone === "mid" && "bg-yellow-400",
              tone === "low" && "bg-red-400"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-right">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold",
              SCORE_TONE_STYLES[tone]
            )}
          >
            {result.score}/{result.maxScore}
          </span>
          <p className="mt-0.5 text-xs text-text-muted">{percent}%</p>
        </div>
        {result.detailHref && (
          <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
        )}
      </div>
    </>
  );

  if (result.detailHref) {
    return (
      <li>
        <Link
          href={result.detailHref}
          className={cn(
            "flex items-center gap-3 py-3 transition-colors hover:bg-bg-elevated/70",
            compact ? "px-4 pl-8 sm:px-5 sm:pl-10" : "px-4 sm:px-5"
          )}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 py-3",
        compact ? "px-4 pl-8 sm:px-5 sm:pl-10" : "px-4 sm:px-5"
      )}
    >
      {content}
    </li>
  );
}

function TypeBadge({ isTest }: { isTest: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        isTest ? "bg-teal-500/10 text-teal-400" : "bg-accent/10 text-accent"
      )}
    >
      {isTest ? (
        <>
          <FlaskConical className="h-3 w-3" />
          Тест
        </>
      ) : (
        <>
          <ClipboardList className="h-3 w-3" />
          Задание
        </>
      )}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[11px] text-text-muted">
      {getCategoryLabel(category)}
    </span>
  );
}

function EmptyResults() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-16 text-center">
      <p className="text-text-secondary">Пока нет результатов</p>
      <p className="mt-1 text-sm text-text-muted">
        Они появятся после выполнения заданий и тестов
      </p>
    </div>
  );
}

function CategoryFilter({
  current,
  compact = false,
}: {
  current?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", !compact && "mb-6")}>
      <CategoryLink href="/results" active={!current} label="Все" compact={compact} />
      {RESULT_CATEGORIES.map((cat) => (
        <CategoryLink
          key={cat.id}
          href={`/results?category=${cat.id}`}
          active={current === cat.id}
          label={getCategoryLabel(cat.id)}
          compact={compact}
        />
      ))}
    </div>
  );
}

function CategoryLink({
  href,
  active,
  label,
  compact = false,
}: {
  href: string;
  active: boolean;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full font-medium transition-colors",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        active
          ? "bg-accent text-white"
          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </Link>
  );
}
