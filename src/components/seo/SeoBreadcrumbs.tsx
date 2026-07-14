import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  buildBreadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";

type SeoBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function SeoBreadcrumbs({ items, className = "" }: SeoBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(items)} />
      <nav
        aria-label="Навигационная цепочка"
        className={`mb-6 ${className}`.trim()}
      >
        <ol className="flex flex-wrap items-center gap-1 text-xs text-text-muted sm:text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-text-muted/70"
                    aria-hidden
                  />
                )}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-accent">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? "text-text-secondary" : undefined}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
