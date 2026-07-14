import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  DashboardLinksPanel,
  StatsTable,
  UtmHelpPanel,
} from "@/components/admin/MarketingDashboardPanels";
import {
  getAdminDashboardGroups,
  UTM_EXAMPLE,
  UTM_FIELD_HINTS,
} from "@/lib/admin-dashboard-links";
import { getMarketingStats, isMarketingAdmin } from "@/lib/marketing-stats";
import { SITE_URL } from "@/lib/legal";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

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
  const dashboardGroups = getAdminDashboardGroups(metrikaId);
  const withoutUtm = stats.bySource.find((r) => r.label === "— (не указано)")?.count ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Маркетинг и трафик</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
            Здесь — <strong className="font-medium text-text-primary">источники регистраций</strong>{" "}
            преподавателей. Все визиты и поведение на сайте — в{" "}
            <a
              href={
                metrikaId
                  ? `https://metrika.yandex.ru/dashboard?id=${metrikaId}`
                  : "https://metrika.yandex.ru"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Яндекс.Метрике
            </a>
            .
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
            <p className="text-sm text-text-muted">С UTM / referrer</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {stats.withAttribution}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Без меток: {withoutUtm}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-4">
            <p className="text-sm text-text-muted">Сайт</p>
            <p className="mt-1 truncate text-sm font-medium">{SITE_URL}</p>
          </div>
        </div>

        <DashboardLinksPanel groups={dashboardGroups} />

        <UtmHelpPanel exampleUrl={UTM_EXAMPLE.replace("https://sferaege.ru", SITE_URL)} />

        <div>
          <h2 className="mb-1 text-sm font-semibold md:text-base">
            Статистика регистраций
          </h2>
          <p className="mb-4 text-xs text-text-muted md:text-sm">
            Считаются только преподаватели, зарегистрировавшиеся после деплоя
            отслеживания. Старые аккаунты без меток попадают в «не указано».
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <StatsTable
              title="utm_source"
              hint={UTM_FIELD_HINTS["utm_source"]}
              rows={stats.bySource}
            />
            <StatsTable
              title="utm_medium"
              hint={UTM_FIELD_HINTS["utm_medium"]}
              rows={stats.byMedium}
            />
            <StatsTable
              title="utm_campaign"
              hint={UTM_FIELD_HINTS["utm_campaign"]}
              rows={stats.byCampaign}
            />
            <StatsTable
              title="Страница входа"
              hint={UTM_FIELD_HINTS["Страница входа"]}
              rows={stats.byLandingPage}
            />
          </div>
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
                  <tr
                    key={`${row.email}-${row.createdAt.toISOString()}`}
                    className="border-b border-border/60"
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-text-muted">
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
