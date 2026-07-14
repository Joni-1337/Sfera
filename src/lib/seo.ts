import type { Metadata } from "next";
import { APP_NAME, APP_TITLE, APP_DESCRIPTION } from "@/lib/branding";
import { SITE_URL } from "@/lib/legal";

export const SITE_NAME = APP_NAME;
export const DEFAULT_TITLE = APP_TITLE;
export const DEFAULT_DESCRIPTION = APP_DESCRIPTION;

export const SEO_KEYWORDS = [
  "ЕГЭ русский",
  "ЕГЭ по русскому",
  "ЕГЭ по русскому языку",
  "подготовка к ЕГЭ русский",
  "подготовка к ЕГЭ по русскому языку",
  "платформа для репетитора ЕГЭ",
  "задания ЕГЭ русский",
  "тесты ЕГЭ русский",
  "репетитор русский язык ЕГЭ",
  "учитель русского ЕГЭ",
  "онлайн подготовка ЕГЭ русский",
  APP_NAME,
  "sferaege",
  "сфера егэ русский",
] as const;

const YANDEX_VERIFICATION = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION?.trim();
const GOOGLE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const siteMetadataBase = new URL(SITE_URL);

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
  keywords = [...SEO_KEYWORDS],
}: PageMetadataInput): Metadata {
  const url = new URL(path, siteMetadataBase).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true },
        },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [...SEO_KEYWORDS],
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/icon", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  verification: {
    ...(YANDEX_VERIFICATION
      ? { yandex: YANDEX_VERIFICATION }
      : {}),
    ...(GOOGLE_VERIFICATION
      ? { google: GOOGLE_VERIFICATION }
      : {}),
  },
};

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export const PUBLIC_INDEXABLE_PATHS = [
  "/",
  "/ege-russkiy",
  "/pricing",
  "/privacy",
  "/offer",
  "/requisites",
] as const;
