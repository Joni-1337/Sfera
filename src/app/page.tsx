import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import HomeLanding from "@/components/home/HomeLanding";
import { HomePageJsonLd } from "@/components/seo/MarketingJsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { TRIAL_DAYS } from "@/lib/subscription-shared";

export const metadata: Metadata = buildPageMetadata({
  title: "СФЕРА — платформа для подготовки к ЕГЭ по русскому языку",
  description: `Платформа для репетиторов и учителей: группы учеников, задания и тесты ЕГЭ, статистика, тексты и словарь. ${TRIAL_DAYS} дня бесплатно для преподавателей, ученики — бесплатно.`,
  path: "/",
});

export default async function HomePage() {
  const session = await getSession();

  if (session?.role === "teacher") {
    redirect("/dashboard");
  }

  if (session?.role === "student") {
    redirect("/dashboard");
  }

  return (
    <>
      <HomePageJsonLd />
      <HomeLanding />
    </>
  );
}
