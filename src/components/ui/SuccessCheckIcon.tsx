import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-5 w-5 [&_svg]:h-2.5 [&_svg]:w-2.5",
  md: "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5",
  lg: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
} as const;

export function SuccessCheckIcon({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-600",
        "text-white shadow-[0_4px_14px_-2px_rgba(16,185,129,0.7),inset_0_1px_0_rgba(255,255,255,0.45)]",
        "ring-1 ring-emerald-200/50",
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
