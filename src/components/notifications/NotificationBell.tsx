"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/notification-actions";
import { markAllTeacherNotificationsRead } from "@/lib/teacher-notification-actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type NotificationBellItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  assignmentId?: string | null;
  testId?: string | null;
  link?: string;
  createdAt: Date | string;
};

function notificationHref(item: NotificationBellItem) {
  if (item.assignmentId) return `/tasks/${item.assignmentId}`;
  if (item.testId) return `/tests/${item.testId}/take`;
  if (item.link) return item.link;
  return null;
}

export function NotificationBell({
  count,
  notifications,
  role,
  userId,
}: {
  count: number;
  notifications: NotificationBellItem[];
  role: "student" | "teacher";
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(count);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setBadgeCount(count);
  }, [count]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && badgeCount > 0) {
      setBadgeCount(0);
      startTransition(async () => {
        if (role === "student") {
          await markAllNotificationsRead();
        } else {
          await markAllTeacherNotificationsRead(userId);
        }
        router.refresh();
      });
    }
  }

  function closeAndNavigate() {
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated transition-colors hover:border-accent/50"
        aria-label={open ? "Закрыть уведомления" : "Уведомления"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-text-secondary" />
        {badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="panel-enter-down absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl shadow-black/50">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">Уведомления</p>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              Уведомлений пока нет
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((item) => {
                const href = notificationHref(item);
                const content = (
                  <>
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                      {item.message}
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </>
                );

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "border-b border-border/60 last:border-b-0",
                      !item.read && "bg-accent/5"
                    )}
                  >
                    {href ? (
                      <Link
                        href={href}
                        onClick={closeAndNavigate}
                        className="block px-4 py-3 transition-colors hover:bg-bg-elevated/60"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {pending && (
            <p className="border-t border-border px-4 py-2 text-center text-[10px] text-text-muted">
              Обновление…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
