import Link from "next/link";
import { SferaLogo } from "@/components/branding/SferaLogo";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  subtitle?: string;
  title?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <SferaLogo href="/" size="md" showTag={false} />
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/pricing"
            className="hidden text-text-secondary transition-colors hover:text-accent sm:inline"
          >
            Тарифы
          </Link>
          <Link
            href="/"
            className="text-text-secondary transition-colors hover:text-accent"
          >
            На главную
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-md flex-col px-4 pb-16 pt-4 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && (
              <p className={cn("text-sm text-text-secondary", title && "mt-2")}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
