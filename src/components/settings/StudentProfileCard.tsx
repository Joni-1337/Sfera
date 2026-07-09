import { KeyRound, User, Users } from "lucide-react";

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

export function StudentProfileCard({
  fullName,
  groupName,
}: {
  fullName: string;
  groupName: string;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-xl font-bold text-accent">
          {getInitials(fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{fullName}</p>
          <p className="text-sm text-text-secondary">Ученик</p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
          <dt className="mb-2 flex items-center gap-2 text-xs text-text-muted">
            <Users className="h-3.5 w-3.5" />
            Группа
          </dt>
          <dd className="font-medium text-accent">{groupName}</dd>
        </div>
        <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
          <dt className="mb-2 flex items-center gap-2 text-xs text-text-muted">
            <KeyRound className="h-3.5 w-3.5" />
            Ключ доступа
          </dt>
          <dd className="text-sm text-text-secondary">Выдаёт преподаватель</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-border/80 bg-bg-elevated/30 px-4 py-3 text-sm text-text-secondary">
        <p className="flex items-start gap-2">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <span>
            Для входа укажите <strong className="text-text-primary">точное ФИО</strong> и{" "}
            <strong className="text-text-primary">ключ</strong>, который дал преподаватель.
          </span>
        </p>
      </div>
    </div>
  );
}
