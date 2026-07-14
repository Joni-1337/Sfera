import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  getMarketingStats,
  isMarketingAdmin,
  type SignupAttributionRow,
} from "@/lib/marketing-stats";
import { SITE_URL } from "@/lib/legal";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

function StatsTable({
  title,
  rows,
}: {
  title: string;
  rows: SignupAttributionRow[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-4 md:p-5">
      <h2 className="mb-3 text-sm font-semibold md:text-base">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">Пока нет данных</p>
      ) : (
        <ul className="space-y-2">
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

export default async function MarketingAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    redirect("/login");
  }

  if (!isMarketingAdmin(session.email)) {
    redirect("/dashboard");
  }

  const stats = await getMarketingStats();
  const metrikaId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Маркетинг и трафик</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
            Источники регистраций преподавателей (UTM и referrer сохраняются при
            регистрации). Для просмотра всех визитов используйте Яндекс.Метрику.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-bg-card p-4">
            <p className="text-sm text-text-muted">Всего преподавателей</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {stats.totalTeachers}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-4">
            <p className="text-sm text-text-muted">С данными об источнике</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {stats.withAttribution}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-4">
            <p className="text-sm text-text-muted">Сайт</p>
            <p className="mt-1 truncate text-sm font-medium">{SITE_URL}</p>
            {metrikaId ? (
              <a
                href={`https://metrika.yandex.ru/dashboard?id=${metrikaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Открыть Метрику →
              </a>
            ) : (
              <p className="mt-2 text-xs text-text-muted">
                Добавьте NEXT_PUBLIC_YANDEX_METRIKA_ID в Vercel
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Как отслеживать рекламу</p>
          <p className="mt-2">
            Добавляйте UTM-метки к ссылкам, например:{" "}
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-xs">
              {SITE_URL}/?utm_source=yandex&utm_medium=cpc&utm_campaign=ege_rus
            </code>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <StatsTable title="utm_source" rows={stats.bySource} />
          <StatsTable title="utm_medium" rows={stats.byMedium} />
          <StatsTable title="utm_campaign" rows={stats.byCampaign} />
          <StatsTable title="Страница входа" rows={stats.byLandingPage} />
        </div>

        <section className="rounded-2xl border border-border bg-bg-card p-4 md:p-5">
          <h2 className="mb-3 text-sm font-semibold md:text-base">
            Последние регистрации
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="px-2 py-2 font-medium">Дата</th>
                  <th className="px-2 py-2 font-medium">Преподаватель</th>
                  <th className="px-2 py-2 font-medium">source</th>
                  <th className="px-2 py-2 font-medium">medium</th>
                  <th className="px-2 py-2 font-medium">referrer</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSignups.map((row) => (
                  <tr key={`${row.email}-${row.createdAt.toISOString()}`} className="border-b border-border/60">
                    <td className="px-2 py-2 whitespace-nowrap text-text-muted">
                      {row.createdAt.toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-medium">{row.fullName}</div>
                      <div className="text-xs text-text-muted">{row.email}</div>
                    </td>
                    <td className="px-2 py-2">{row.source ?? "—"}</td>
                    <td className="px-2 py-2">{row.medium ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-2 py-2 text-xs text-text-muted">
                      {row.referrer ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Link
          href="/dashboard"
          className="inline-block text-sm text-accent hover:underline"
        >
          ← На главную
        </Link>
      </div>
    </AppShell>
  );
}
