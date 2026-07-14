import { SITE_URL } from "@/lib/legal";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href
        ? {
            item: item.href.startsWith("http")
              ? item.href
              : new URL(item.href, SITE_URL).toString(),
          }
        : {}),
    })),
  };
}

export const HOME_BREADCRUMB: BreadcrumbItem = { label: "Главная", href: "/" };
