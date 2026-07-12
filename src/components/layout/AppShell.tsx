import { requireValidSession } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider, type UiTheme } from "@/components/layout/ThemeProvider";
import { getUnreadNotificationCount, getRecentNotifications } from "@/lib/notification-actions";
import {
  getUnreadTeacherNotificationCount,
  getTeacherNotifications,
} from "@/lib/teacher-notification-actions";
import { getTeacherSubscription } from "@/lib/subscription";

async function getUiTheme(
  session: Awaited<ReturnType<typeof requireValidSession>>
): Promise<UiTheme> {
  try {
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { uiTheme: true },
      });
      return teacher?.uiTheme === "light" ? "light" : "dark";
    }

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      select: { group: { select: { teacher: { select: { uiTheme: true } } } } },
    });

    return student?.group.teacher.uiTheme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await requireValidSession();

  const [unreadCount, notifications, subscriptionPlan, uiTheme] = await Promise.all([
    session.role === "student"
      ? getUnreadNotificationCount(session.id)
      : getUnreadTeacherNotificationCount(session.id),
    session.role === "student"
      ? getRecentNotifications(session.id)
      : getTeacherNotifications(session.id, 8),
    session.role === "teacher"
      ? (await getTeacherSubscription(session.id))?.plan ?? null
      : null,
    getUiTheme(session),
  ]);

  return (
    <ThemeProvider theme={uiTheme}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar
          session={session}
          unreadCount={unreadCount}
          notifications={notifications}
          subscriptionPlan={subscriptionPlan}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10 lg:px-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
