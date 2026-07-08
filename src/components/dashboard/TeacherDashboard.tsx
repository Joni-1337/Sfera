import Link from "next/link";
import {
  Users,
  BarChart3,
  ClipboardCheck,
  Plus,
  ClipboardList,
  FlaskConical,
  FileText,
  BookMarked,
  AlertCircle,
  Clock,
  EyeOff,
  TrendingUp,
  Activity,
  ChevronRight,
  UserX,
} from "lucide-react";
import { GroupCard } from "./GroupCard";
import { AddGroupForm } from "./AddGroupForm";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  AttentionItem,
  GroupWithStats,
  RecentActivity,
  TeacherDashboardStats,
} from "@/lib/teacher-dashboard-data";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import type { TeacherSubscription } from "@/lib/subscription-shared";

const groupLinks = [
  { label: "Ученики", icon: Users, href: "students" },
  { label: "Задания", icon: ClipboardCheck, href: "assignments" },
  {
    label: "Тесты",
    icon: FlaskConical,
    href: "tests",
    absoluteHref: (groupId: string) => `/tests?groupId=${groupId}`,
  },
  { label: "Статистика", icon: BarChart3, href: "stats" },
];

const QUICK_ACTIONS = [
  { href: "/tasks", label: "Задания", icon: ClipboardList },
  { href: "/tests", label: "Тесты", icon: FlaskConical },
  { href: "/texts", label: "Тексты", icon: FileText },
  { href: "/results", label: "Результаты", icon: BarChart3 },
  { href: "/hard-words", label: "Словарь", icon: BookMarked },
] as const;

const ATTENTION_ICONS: Record<
  AttentionItem["type"],
  React.ComponentType<{ className?: string }>
> = {
  draft_assignment: EyeOff,
  draft_test: EyeOff,
  low_completion: AlertCircle,
  inactive_student: UserX,
  deadline_soon: Clock,
  deadline_overdue: AlertCircle,
};

const ATTENTION_STYLES: Record<AttentionItem["type"], string> = {
  draft_assignment: "bg-yellow-500/10 text-yellow-400",
  draft_test: "bg-yellow-500/10 text-yellow-400",
  low_completion: "bg-orange-500/10 text-orange-400",
  inactive_student: "bg-bg-elevated text-text-muted",
  deadline_soon: "bg-blue-500/10 text-blue-400",
  deadline_overdue: "bg-red-500/10 text-red-400",
};

export function TeacherDashboard({
  fullName,
  groups,
  stats,
  attention,
  recentActivity,
  firstGroupId,
  subscription,
  showArchived = false,
}: {
  fullName: string;
  groups: GroupWithStats[];
  stats: TeacherDashboardStats;
  attention: AttentionItem[];
  recentActivity: RecentActivity[];
  firstGroupId: string | null;
  subscription: TeacherSubscription | null;
  showArchived?: boolean;
}) {
  const createAssignmentHref = firstGroupId
    ? `/dashboard/group/${firstGroupId}/assignments/new`
    : "/tasks";

  return (
    <div className="space-y-8">
      {subscription && !showArchived && <SubscriptionBanner sub={subscription} />}

      {/* Шапка */}
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Дашборд ЕГЭ</h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-base">
            {fullName}
            {showArchived && (
              <span className="ml-2 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                Архив
              </span>
            )}
          </p>
        </div>

        {!showArchived && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {firstGroupId && (
              <Link
                href={createAssignmentHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                <Plus className="h-4 w-4" />
                <span className="truncate">Задание</span>
              </Link>
            )}
            <Link
              href="/hard-words"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent",
                !firstGroupId && "col-span-2 sm:col-span-1"
              )}
            >
              <BookMarked className="h-4 w-4" />
              <span className="truncate">Словарь</span>
            </Link>
          </div>
        )}
      </header>

      {!showArchived && (
        <>
          {/* Быстрые действия */}
          <section>
            <SectionTitle>Быстрые действия</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-card px-2 py-3 text-center transition-all hover:border-accent/30 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Icon className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight sm:text-sm">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Группы — сразу под быстрыми действиями */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle inline>
            {showArchived ? "Архивные группы" : "Мои группы"}
          </SectionTitle>
          {!showArchived ? (
            <Link
              href="/dashboard?view=archived"
              className="shrink-0 text-xs text-text-muted hover:text-accent sm:text-sm"
            >
              Архив →
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="shrink-0 text-xs text-accent hover:underline sm:text-sm"
            >
              Активные →
            </Link>
          )}
        </div>

        <GroupsGrid
          groups={groups}
          showArchived={showArchived}
          showAddGroup={!showArchived}
        />
      </section>

      {!showArchived && (
        <>
          {/* Сводка */}
          <section>
            <SectionTitle>Сводка</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
              <StatCard
                icon={Users}
                label="Учеников"
                value={String(stats.totalStudents)}
              />
              <StatCard
                icon={ClipboardList}
                label="Задания"
                value={String(stats.publishedAssignments)}
                hint={
                  stats.draftAssignments > 0
                    ? `+${stats.draftAssignments} черн.`
                    : undefined
                }
              />
              <StatCard
                icon={FlaskConical}
                label="Тесты"
                value={String(stats.publishedTests)}
                hint={
                  stats.draftTests > 0 ? `+${stats.draftTests} черн.` : undefined
                }
              />
              <StatCard
                icon={BarChart3}
                label="Средний балл"
                value={stats.avgScore > 0 ? `${stats.avgScore}%` : "—"}
              />
              <StatCard
                icon={Activity}
                label="За неделю"
                value={String(stats.weeklySubmissions)}
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </section>

          {/* Внимание + активность */}
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Panel
              title="Требует внимания"
              badge={attention.length > 0 ? attention.length : undefined}
            >
              {attention.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Всё в порядке"
                  subtitle="Нет черновиков, просрочек и неактивных учеников"
                />
              ) : (
                <ul className="space-y-2">
                  {attention.map((item) => {
                    const Icon = ATTENTION_ICONS[item.type];
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 rounded-xl bg-bg-elevated/80 px-3 py-2.5 transition-colors hover:bg-bg-elevated"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              ATTENTION_STYLES[item.type]
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.title}</p>
                            <p className="truncate text-xs text-text-muted">
                              {item.subtitle}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="Последняя активность"
              action={
                <Link href="/results" className="text-xs text-accent hover:underline sm:text-sm">
                  Все →
                </Link>
              }
            >
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="Пока нет сдач"
                  subtitle="Результаты учеников появятся здесь"
                />
              ) : (
                <ul className="space-y-2">
                  {recentActivity.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-bg-elevated/80 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.studentName}</p>
                        <p className="truncate text-xs text-text-muted">
                          {a.groupName} · {a.taskName}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {formatDateTime(a.completedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
                        {a.score}/{a.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function GroupsGrid({
  groups,
  showArchived,
  showAddGroup,
}: {
  groups: GroupWithStats[];
  showArchived: boolean;
  showAddGroup: boolean;
}) {
  if (groups.length === 0 && !showAddGroup) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-12 text-center">
        <p className="text-sm text-text-secondary">Групп пока нет</p>
      </div>
    );
  }

  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.id} className="w-[85vw] max-w-[320px] shrink-0 sm:w-auto sm:max-w-none">
          <GroupCard
            compact
            group={{
              id: group.id,
              name: group.name,
              _count: { students: group.studentCount },
            }}
            stats={{
              assignmentCount: group.assignmentCount,
              testCount: group.testCount,
              avgScore: group.avgScore,
            }}
            links={groupLinks}
            archived={showArchived}
          />
        </div>
      ))}

      {showAddGroup && (
        <div className="flex w-[85vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none">
          <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-card/50 p-6">
            <AddGroupForm />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  children,
  inline = false,
}: {
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
  }
  return <h2 className="mb-3 text-lg font-semibold">{children}</h2>;
}

function Panel({
  title,
  badge,
  action,
  children,
}: {
  title: string;
  badge?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          {badge !== undefined && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center sm:py-8">
      <Icon className="mb-2 h-8 w-8 text-text-muted/40 sm:h-10 sm:w-10" />
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 sm:flex-col sm:items-start sm:gap-0 sm:p-4",
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 sm:mb-2 sm:h-10 sm:w-10 sm:rounded-xl">
        <Icon className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="text-[11px] text-text-secondary sm:text-xs">{label}</p>
        <p className="text-lg font-bold tabular-nums sm:text-xl">{value}</p>
        {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
      </div>
    </div>
  );
}
