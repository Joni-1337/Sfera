import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = LucideIcon | React.ComponentType<{ className?: string }>;

const variantStyles = {
  teal: {
    gradient: "from-teal-300/30 via-accent/20 to-slate-900/85",
    ring: "ring-teal-300/30",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(20,184,166,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]",
    icon: "text-teal-200 drop-shadow-[0_2px_6px_rgba(20,184,166,0.65)]",
  },
  amber: {
    gradient: "from-amber-300/30 via-yellow-500/15 to-slate-900/85",
    ring: "ring-amber-300/30",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]",
    icon: "text-amber-200 drop-shadow-[0_2px_6px_rgba(251,191,36,0.55)]",
  },
  orange: {
    gradient: "from-orange-300/30 via-orange-500/20 to-slate-900/85",
    ring: "ring-orange-300/30",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(249,115,22,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]",
    icon: "text-orange-200 drop-shadow-[0_2px_6px_rgba(249,115,22,0.55)]",
  },
  blue: {
    gradient: "from-sky-300/25 via-blue-500/15 to-slate-900/85",
    ring: "ring-sky-300/30",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(56,189,248,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]",
    icon: "text-sky-200 drop-shadow-[0_2px_6px_rgba(56,189,248,0.5)]",
  },
  violet: {
    gradient: "from-violet-300/25 via-purple-500/15 to-slate-900/85",
    ring: "ring-violet-300/30",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(167,139,250,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]",
    icon: "text-violet-200 drop-shadow-[0_2px_6px_rgba(167,139,250,0.5)]",
  },
  neutral: {
    gradient: "from-slate-300/20 via-slate-500/15 to-slate-900/90",
    ring: "ring-slate-400/25",
    shadow:
      "shadow-[0_8px_22px_-10px_rgba(100,116,139,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]",
    icon: "text-slate-200 drop-shadow-[0_2px_6px_rgba(148,163,184,0.45)]",
  },
} as const;

const sizeStyles = {
  sm: { box: "h-10 w-10", icon: "h-5 w-5", gloss: "rounded-xl", rounded: "rounded-[10px]" },
  md: { box: "h-12 w-12", icon: "h-6 w-6", gloss: "rounded-xl", rounded: "rounded-[11px]" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", gloss: "rounded-2xl", rounded: "rounded-[14px]" },
} as const;

export function AccentIcon3D({
  icon: Icon,
  size = "md",
  variant = "teal",
  shape = "rounded",
  className,
}: {
  icon: IconComponent;
  size?: keyof typeof sizeStyles;
  variant?: keyof typeof variantStyles;
  shape?: "rounded" | "circle";
  className?: string;
}) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br ring-1",
        s.box,
        shape === "circle" ? "rounded-full" : s.gloss,
        v.gradient,
        v.ring,
        v.shadow,
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-[3px] bg-gradient-to-br from-white/10 to-transparent",
          shape === "circle" ? "rounded-full" : s.rounded
        )}
      />
      <Icon className={cn("relative", s.icon, v.icon)} strokeWidth={1.85} />
    </div>
  );
}
