import Link from "next/link";
import { Settings } from "lucide-react";
import { UnarchiveGroupButton } from "./UnarchiveGroupButton";

type GroupLink = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  absoluteHref?: (groupId: string) => string;
};

export function GroupCard({
  group,
  links,
  stats,
  archived = false,
  compact = false,
}: {
  group: { id: string; name: string; _count: { students: number } };
  links: GroupLink[];
  stats?: {
    assignmentCount: number;
    testCount: number;
    avgScore: number | null;
  };
  archived?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex h-full min-w-[280px] snap-start flex-col rounded-2xl border border-border bg-bg-card p-4 md:min-w-0 md:p-5 lg:p-6"
          : "relative flex h-full flex-col rounded-2xl border border-border bg-bg-card p-5 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold md:text-lg lg:text-xl">{group.name}</h3>
          {stats && !archived && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatBadge>{group._count.students} уч.</StatBadge>
              <StatBadge>{stats.assignmentCount} зад.</StatBadge>
              <StatBadge>{stats.testCount} тест.</StatBadge>
              {stats.avgScore !== null && (
                <StatBadge accent>~{stats.avgScore}%</StatBadge>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {archived && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
              Архив
            </span>
          )}
          <Link
            href={`/dashboard/group/${group.id}/settings`}
            title="Настройки группы"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-accent"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ul className="mt-auto space-y-0.5 border-t border-border/60 pt-3">
        {links.map((link) => {
          const href = link.absoluteHref
            ? link.absoluteHref(group.id)
            : `/dashboard/group/${group.id}/${link.href}`;

          return (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary md:gap-3 md:px-3 md:py-2.5 md:text-base"
            >
              <link.icon className="h-4 w-4 shrink-0 text-accent/70" />
              <span className="truncate">{link.label}</span>
              {link.href === "students" && !link.absoluteHref && (
                <span className="ml-auto text-xs tabular-nums text-text-muted">
                  {group._count.students}
                </span>
              )}
            </Link>
          </li>
          );
        })}
      </ul>

      {archived && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <UnarchiveGroupButton groupId={group.id} groupName={group.name} />
        </div>
      )}
    </div>
  );
}

function StatBadge({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={
        accent
          ? "rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent md:text-xs"
          : "rounded-md bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted md:text-xs"
      }
    >
      {children}
    </span>
  );
}
