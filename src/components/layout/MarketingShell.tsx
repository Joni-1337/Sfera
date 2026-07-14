import Link from "next/link";
import { SferaLogo } from "@/components/branding/SferaLogo";
import { APP_NAME } from "@/lib/branding";
import {
  MARKETING_NAV_LINKS,
  type MarketingNavKey,
} from "@/lib/marketing-nav";

export function MarketingShell({
  children,
  activeNav,
}: {
  children: React.ReactNode;
  activeNav?: MarketingNavKey;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-teal-400/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <SferaLogo href="/" size="md" showTag={false} />
        <nav
          className="hidden items-center gap-6 text-sm sm:flex"
          aria-label="Основное меню"
        >
          <Link
            href="/#features"
            className="text-text-secondary transition-colors hover:text-accent"
          >
            Возможности
          </Link>
          {MARKETING_NAV_LINKS.map(({ label, path, navKey }) => (
            <Link
              key={path}
              href={path}
              className={
                activeNav === navKey
                  ? "font-medium text-accent"
                  : "text-text-secondary transition-colors hover:text-accent"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-accent sm:px-4"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:px-4"
          >
            Начать бесплатно
          </Link>
        </div>
      </header>

      <main className="relative">{children}</main>

      <footer className="relative mt-20 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="mt-1 text-xs text-text-muted">
              Подготовка к ЕГЭ по русскому языку
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-text-muted sm:justify-end">
            <Link href="/ege-russkiy" className="hover:text-accent">
              ЕГЭ русский
            </Link>
            <Link href="/pricing" className="hover:text-accent">
              Тарифы
            </Link>
            <Link href="/offer" className="hover:text-accent">
              Оферта
            </Link>
            <Link href="/requisites" className="hover:text-accent">
              Реквизиты
            </Link>
            <Link href="/login" className="hover:text-accent">
              Вход
            </Link>
            <Link href="/privacy" className="hover:text-accent">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
