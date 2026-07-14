import { cn } from "@/lib/utils";

const roleConfig = {
  teacher: {
    label: "Преподаватель",
    gradient: "from-amber-300/35 via-teal-400/25 to-slate-900/90",
    ring: "ring-amber-300/30",
    shadow: "shadow-[0_10px_28px_-10px_rgba(251,191,36,0.45),0_8px_24px_-8px_rgba(20,184,166,0.4),inset_0_1px_0_rgba(255,255,255,0.14)]",
  },
  student: {
    label: "Ученик",
    gradient: "from-teal-300/35 via-cyan-400/20 to-slate-900/90",
    ring: "ring-teal-300/35",
    shadow: "shadow-[0_10px_28px_-10px_rgba(45,212,191,0.5),inset_0_1px_0_rgba(255,255,255,0.14)]",
  },
} as const;

function TeacherCapSvg() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <defs>
        <linearGradient id="cap-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="cap-band" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>
      </defs>
      <path
        d="M6 22 24 14l18 8-18 8-18-8Z"
        fill="url(#cap-top)"
        stroke="#ccfbf1"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M38 24v8c0 2.2-6.3 4-14 4s-14-1.8-14-4v-8"
        fill="url(#cap-band)"
        stroke="#99f6e4"
        strokeWidth="0.8"
      />
      <path
        d="M42 22v10"
        stroke="#fde68a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="42" cy="34" r="2.2" fill="#fbbf24" />
    </svg>
  );
}

function StudentAvatarSvg() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
      <defs>
        <linearGradient id="student-head" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="student-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="17" r="8" fill="url(#student-head)" stroke="#ccfbf1" strokeWidth="0.8" />
      <path
        d="M10 40c2.5-7 7.5-10.5 14-10.5S35.5 33 38 40"
        fill="url(#student-body)"
        stroke="#99f6e4"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlanRoleIcon({
  role,
  className,
}: {
  role: keyof typeof roleConfig;
  className?: string;
}) {
  const config = roleConfig[role];

  return (
    <div
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
        config.gradient,
        config.ring,
        config.shadow,
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-[3px] rounded-[14px] bg-gradient-to-br from-white/10 to-transparent" />
      {role === "teacher" ? <TeacherCapSvg /> : <StudentAvatarSvg />}
    </div>
  );
}
