import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_SUBJECT_TAG } from "@/lib/branding";
import { SferaSphereIcon } from "./SferaSphereIcon";

type SferaLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
  hideTagOnMobile?: boolean;
  className?: string;
};

const sizeConfig = {
  sm: {
    icon: 28,
    title: "text-sm",
    tag: "text-[9px] px-1.5 py-0",
  },
  md: {
    icon: 36,
    title: "text-base sm:text-lg",
    tag: "text-[10px] px-2 py-0.5",
  },
  lg: {
    icon: 44,
    title: "text-2xl sm:text-3xl",
    tag: "text-[11px] px-2.5 py-0.5",
  },
} as const;

export function SferaLogo({
  href = "/",
  size = "md",
  showTag = true,
  hideTagOnMobile = false,
  className,
}: SferaLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SferaSphereIcon size={config.icon} />
      <div className="min-w-0 leading-none">
        <span
          className={cn(
            "block font-bold uppercase tracking-wide text-text-primary",
            config.title
          )}
        >
          {APP_NAME}
        </span>
        {showTag && (
          <span
            className={cn(
              "mt-1 inline-block rounded-md bg-bg-elevated font-medium uppercase tracking-wide text-text-muted ring-1 ring-border/80",
              config.tag,
              hideTagOnMobile && "hidden sm:inline-block"
            )}
          >
            {APP_SUBJECT_TAG}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
