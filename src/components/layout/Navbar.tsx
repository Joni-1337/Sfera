"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  BarChart3,
  FlaskConical,
  User,
  LogOut,
  Coins,
  Settings,
  Menu,
  X,
  Crown,
  Sparkles,
  AlertTriangle,
  BookMarked,
  Search,
} from "lucide-react";
import { logout } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";
import type { PlanType } from "@/lib/subscription-shared";
import { planLabel } from "@/lib/subscription-shared";
import {
  NotificationBell,
  type NotificationBellItem,
} from "@/components/notifications/NotificationBell";
import { SferaLogo } from "@/components/branding/SferaLogo";

const studentNav: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/texts", label: "Тексты", icon: FileText },
  { href: "/tasks", label: "Задания", icon: ClipboardList },
  { href: "/results", label: "Результаты", icon: BarChart3 },
  { href: "/tests", label: "Тесты", icon: FlaskConical },
  { href: "/hard-words", label: "Словарь", icon: BookMarked },
];

const teacherNav: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/texts", label: "Тексты", icon: FileText },
  { href: "/tasks", label: "Задания", icon: ClipboardList },
  { href: "/results", label: "Результаты", icon: BarChart3 },
  { href: "/tests", label: "Тесты", icon: FlaskConical },
  { href: "/hard-words", label: "Словарь", icon: BookMarked },
];

export function Navbar({
  session,
  unreadCount = 0,
  notifications = [],
  subscriptionPlan = null,
}: {
  session: SessionPayload;
  unreadCount?: number;
  notifications?: NotificationBellItem[];
  subscriptionPlan?: PlanType | null;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const nav = session.role === "teacher" ? teacherNav : studentNav;
  const hasPro = session.role === "teacher" && subscriptionPlan === "pro";
  const hasTrial = session.role === "teacher" && subscriptionPlan === "trial";
  const hasPremium = hasPro || hasTrial;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isNavActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-border bg-bg-card/90 px-4 py-2.5 backdrop-blur-xl">
        <SferaLogo href="/dashboard" size="sm" hideTagOnMobile />

        <div className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const isActive = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <NavbarSearch />
          </div>
          <NotificationBell
            count={unreadCount}
            notifications={notifications}
            role={session.role}
            userId={session.id}
          />
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              setMobileOpen(!mobileOpen);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary transition-colors hover:border-accent/50 hover:text-accent md:hidden"
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setProfileOpen(!profileOpen);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            aria-label={profileOpen ? "Закрыть меню профиля" : "Меню профиля"}
            aria-expanded={profileOpen}
          >
            {hasPremium ? (
              <>
                <span
                  className={cn(
                    "absolute inset-0 rounded-full p-[2px]",
                    hasPro
                      ? "bg-gradient-to-br from-amber-400 via-accent to-teal-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                      : "bg-gradient-to-br from-accent/80 to-teal-400/80"
                  )}
                >
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-bg-elevated">
                    <User
                      className={cn(
                        "h-5 w-5",
                        hasPro ? "text-accent" : "text-teal-400"
                      )}
                    />
                  </span>
                </span>
                {hasPro ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-accent ring-2 ring-bg-card">
                    <Crown className="h-2.5 w-2.5 text-white" />
                  </span>
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-400 ring-2 ring-bg-card">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </>
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full border border-border bg-bg-elevated transition-colors hover:border-accent/50">
                <User className="h-5 w-5 text-text-secondary" />
              </span>
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-bg-card py-2 shadow-2xl shadow-black/50">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{session.name}</p>
                    {session.email && (
                      <p className="text-xs text-text-muted">{session.email}</p>
                    )}
                    {session.groupName && (
                      <p className="mt-0.5 text-xs text-accent">{session.groupName}</p>
                    )}
                  </div>
                  {session.role === "teacher" && subscriptionPlan && (
                    <SubscriptionBadge plan={subscriptionPlan} />
                  )}
                </div>
              </div>

              {session.role === "teacher" && (
                <Link
                  href="/pricing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated"
                >
                  {hasPro ? (
                    <Crown className="h-4 w-4 text-amber-400" />
                  ) : hasTrial ? (
                    <Sparkles className="h-4 w-4 text-teal-400" />
                  ) : (
                    <Coins className="h-4 w-4" />
                  )}
                  {hasPro ? "Подписка активна" : hasTrial ? "Пробный период" : "Подписка"}
                </Link>
              )}
              {session.role === "teacher" && (
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated"
                >
                  <Settings className="h-4 w-4" />
                  Настройки аккаунта
                </Link>
              )}
              {session.role === "student" && (
                <Link
                  href="/student-settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated"
                >
                  <Settings className="h-4 w-4" />
                  Настройки
                </Link>
              )}

              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-black/60"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-4 right-4 top-[4.75rem] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-bg-card p-3 shadow-2xl shadow-black/50">
            <MobileMenuSearch onNavigate={closeMobileMenu} />
            <nav className="space-y-1">
              {nav.map((item) => {
                const isActive = isNavActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-bg-elevated text-text-primary"
                        : "text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function SubscriptionBadge({ plan }: { plan: PlanType }) {
  if (plan === "pro") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/30">
        <Crown className="h-3 w-3" />
        Pro
      </span>
    );
  }

  if (plan === "trial") {
    return (
      <span className="badge-trial inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
        <Sparkles className="h-3 w-3" />
        {planLabel(plan)}
      </span>
    );
  }

  if (plan === "expired") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-400 ring-1 ring-yellow-500/30">
        <AlertTriangle className="h-3 w-3" />
        Подписка
      </span>
    );
  }

  return null;
}

function NavbarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setExpanded(false);
    }
  }

  if (expanded) {
    return (
      <form onSubmit={handleSubmit} className="relative hidden sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => {
            if (!query.trim()) setExpanded(false);
          }}
          placeholder="Поиск..."
          className="w-44 rounded-xl border border-border bg-bg-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-accent lg:w-52"
        />
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
        aria-label="Поиск"
      >
        <Search className="h-4 w-4" />
      </button>
    </>
  );
}

function MobileMenuSearch({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      onNavigate();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-3">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
        className="w-full rounded-xl border border-border bg-bg-elevated py-2.5 pl-9 pr-16 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover"
      >
        Найти
      </button>
    </form>
  );
}
