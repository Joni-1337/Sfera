"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import {
  markTeacherNotificationRead,
  markAllTeacherNotificationsRead,
} from "@/lib/teacher-notification-actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TeacherNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date | string;
};

export function TeacherNotificationsView({
  notifications,
  teacherId,
}: {
  notifications: TeacherNotification[];
  teacherId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    startTransition(async () => {
      await markTeacherNotificationRead(id, teacherId);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllTeacherNotificationsRead(teacherId);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          {unread > 0 && (
            <p className="text-sm text-accent">{unread} непрочитанных</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            disabled={pending}
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Прочитать все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="mb-4 h-12 w-12 text-text-muted" />
          <p className="text-text-secondary">Уведомлений пока нет</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                n.read
                  ? "border-border bg-bg-card/50"
                  : "border-accent/30 bg-accent/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{n.message}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {formatDateTime(n.createdAt)}
                  </p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markRead(n.id)}
                      className="mt-2 inline-block text-sm text-accent hover:underline"
                    >
                      Перейти →
                    </Link>
                  )}
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    disabled={pending}
                    className="shrink-0 text-xs text-accent hover:underline"
                  >
                    Прочитано
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
