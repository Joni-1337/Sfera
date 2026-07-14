import { prisma } from "@/lib/prisma";

export type SignupAttributionRow = {
  label: string;
  count: number;
};

export type MarketingStats = {
  totalTeachers: number;
  withAttribution: number;
  bySource: SignupAttributionRow[];
  byMedium: SignupAttributionRow[];
  byCampaign: SignupAttributionRow[];
  byLandingPage: SignupAttributionRow[];
  recentSignups: Array<{
    fullName: string;
    email: string;
    createdAt: Date;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    referrer: string | null;
    landingPage: string | null;
  }>;
};

function aggregate(
  rows: Array<{ key: string | null; count: number }>
): SignupAttributionRow[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const label = row.key?.trim() || "— (не указано)";
    map.set(label, (map.get(label) ?? 0) + row.count);
  }

  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getMarketingStats(): Promise<MarketingStats> {
  const [
    totalTeachers,
    withAttribution,
    bySourceRaw,
    byMediumRaw,
    byCampaignRaw,
    byLandingRaw,
    recentSignups,
  ] = await Promise.all([
    prisma.teacher.count(),
    prisma.teacher.count({
      where: {
        OR: [
          { signupUtmSource: { not: null } },
          { signupReferrer: { not: null } },
          { signupLandingPage: { not: null } },
        ],
      },
    }),
    prisma.teacher.groupBy({
      by: ["signupUtmSource"],
      _count: { _all: true },
    }),
    prisma.teacher.groupBy({
      by: ["signupUtmMedium"],
      _count: { _all: true },
    }),
    prisma.teacher.groupBy({
      by: ["signupUtmCampaign"],
      _count: { _all: true },
    }),
    prisma.teacher.groupBy({
      by: ["signupLandingPage"],
      _count: { _all: true },
    }),
    prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        fullName: true,
        email: true,
        createdAt: true,
        signupUtmSource: true,
        signupUtmMedium: true,
        signupUtmCampaign: true,
        signupReferrer: true,
        signupLandingPage: true,
      },
    }),
  ]);

  return {
    totalTeachers,
    withAttribution,
    bySource: aggregate(
      bySourceRaw.map((row) => ({
        key: row.signupUtmSource,
        count: row._count._all,
      }))
    ),
    byMedium: aggregate(
      byMediumRaw.map((row) => ({
        key: row.signupUtmMedium,
        count: row._count._all,
      }))
    ),
    byCampaign: aggregate(
      byCampaignRaw.map((row) => ({
        key: row.signupUtmCampaign,
        count: row._count._all,
      }))
    ),
    byLandingPage: aggregate(
      byLandingRaw.map((row) => ({
        key: row.signupLandingPage,
        count: row._count._all,
      }))
    ),
    recentSignups: recentSignups.map((row) => ({
      fullName: row.fullName,
      email: row.email,
      createdAt: row.createdAt,
      source: row.signupUtmSource,
      medium: row.signupUtmMedium,
      campaign: row.signupUtmCampaign,
      referrer: row.signupReferrer,
      landingPage: row.signupLandingPage,
    })),
  };
}

export function isMarketingAdmin(email: string | undefined | null) {
  const adminEmail = process.env.MARKETING_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}
