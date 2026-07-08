import { cn } from "@/lib/utils";

export function SferaSphereIcon({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="sfera-core" cx="38%" cy="32%" r="58%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="35%" stopColor="#2dd4bf" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
        <linearGradient id="sfera-band" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="sfera-teal" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill="url(#sfera-core)" />
      <ellipse cx="24" cy="24" rx="22" ry="8" fill="url(#sfera-band)" transform="rotate(-18 24 24)" />
      <path
        d="M6 24c4-10 12-16 18-16s14 6 18 16"
        stroke="url(#sfera-teal)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M8 30c5 8 12 12 16 12s11-4 16-12"
        stroke="#94a3b8"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M10 18c6-6 14-8 14-8s8 2 14 8"
        stroke="#e2e8f0"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <circle cx="17" cy="16" r="4.5" fill="white" opacity="0.18" />
    </svg>
  );
}
