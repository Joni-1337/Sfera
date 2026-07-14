import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import HomeLanding from "@/components/home/HomeLanding";
import { HomePageJsonLd } from "@/components/seo/MarketingJsonLd";
import { APP_NAME } from "@/lib/branding";
import { buildPageMetadata } from "@/lib/seo";
import { TRIAL_DAYS } from "@/lib/subscription-shared";

export const metadata: Metadata = buildPageMetadata({
  title: "СФЕРА — подготовка к ЕГЭ по русскому языку онлайн",
  description: `Платформа ${APP_NAME} для репетиторов и учителей: группы, задания и тесты ЕГЭ русский, статистика, тексты и словарь. ${TRIAL_DAYS} дня бесплатно — ученики ваших групп бесплатно.`,
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
