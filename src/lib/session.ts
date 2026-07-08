import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const CLEAR_SESSION_PATH = "/api/auth/clear";

export type SessionCheck =
  | { status: "valid"; session: SessionPayload }
  | { status: "missing" }
  | { status: "stale" };

export async function checkSession(): Promise<SessionCheck> {
  const session = await getSession();
  if (!session?.id || !session?.role) {
    return { status: "missing" };
  }

  const exists =
    session.role === "teacher"
      ? await prisma.teacher.findUnique({
          where: { id: session.id },
          select: { id: true },
        })
      : await prisma.student.findUnique({
          where: { id: session.id },
          select: { id: true },
        });

  if (!exists) {
    return { status: "stale" };
  }

  return { status: "valid", session };
}

export async function getValidSession(): Promise<SessionPayload | null> {
  const check = await checkSession();
  return check.status === "valid" ? check.session : null;
}
