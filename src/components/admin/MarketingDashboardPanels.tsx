import { ExternalLink } from "lucide-react";
import type { AdminDashboardGroup } from "@/lib/admin-dashboard-links";
import type { SignupAttributionRow } from "@/lib/marketing-stats";

export function DashboardLinksPanel({ groups }: { groups: AdminDashboardGroup[] }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-4 md:p-5">
      <h2 className="text-sm font-semibold md:text-base">Быстрые ссылки</h2>
      <p className="mt-1 text-sm text-text-muted">
        Все панели управления проектом в одном месте
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-xl border border-border/80 bg-bg-elevated/40 p-3"
          >
            <h3 className="text-sm font-semibold text-text-primary">
              {group.title}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{group.description}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent opacity-80" />
                    <span>
                      <span className="block text-sm font-medium text-accent group-hover:underline">
                        {link.label}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {link.hint}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function UtmHelpPanel({ exampleUrl }: { exampleUrl: string }) {
  return (
    <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4 md:p-5">
      <h2 className="text-sm font-semibold text-text-primary md:text-base">
        Что означают UTM-метки
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-bg-card/60 px-3 py-2 text-sm">
          <p className="font-medium text-text-primary">utm_source</p>
          <p className="mt-0.5 text-text-muted">Откуда: yandex, google, vk, telegram</p>
        </div>
        <div className="rounded-xl bg-bg-card/60 px-3 py-2 text-sm">
          <p className="font-medium text-text-primary">utm_medium</p>
          <p className="mt-0.5 text-text-muted">Тип: cpc (реклама), social, email</p>
        </div>
        <div className="rounded-xl bg-bg-card/60 px-3 py-2 text-sm">
          <p className="font-medium text-text-primary">utm_campaign</p>
          <p className="mt-0.5 text-text-muted">Название кампании: ege_rus, spring2026</p>
        </div>
        <div className="rounded-xl bg-bg-card/60 px-3 py-2 text-sm">
          <p className="font-medium text-text-primary">Страница входа</p>
          <p className="mt-0.5 text-text-muted">
            Первая страница до регистрации: / или /pricing
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">«— (не указано)»</span>{" "}
        — преподаватель зарегистрировался без UTM-меток: прямой заход, ссылка
        без меток или регистрация до включения отслеживания. Новые регистрации
        с рекламной ссылки будут с данными.
      </p>
      <p className="mt-3 text-sm text-text-secondary">
        Пример ссылки для рекламы:{" "}
        <code className="break-all rounded bg-bg-elevated px-1.5 py-0.5 text-xs">
          {exampleUrl}
        </code>
      </p>
    </section>
  );
}

export function StatsTable({
  title,
  hint,
  rows,
}: {
  title: string;
  hint?: string;
  rows: SignupAttributionRow[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-4 md:p-5">
      <h2 className="text-sm font-semibold md:text-base">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">Пока нет данных</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={`${title}-${row.label}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated/60 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{row.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-accent">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
