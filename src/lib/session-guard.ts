import { redirect } from "next/navigation";
import { checkSession, CLEAR_SESSION_PATH } from "@/lib/session";
import type { SessionPayload } from "@/lib/auth";

export async function requireValidSession(): Promise<SessionPayload> {
  const check = await checkSession();

  if (check.status === "stale") {
    redirect(CLEAR_SESSION_PATH);
  }

  if (check.status === "missing") {
    redirect("/login");
  }

  return check.session;
}

export async function resolveGuestSession(): Promise<void> {
  const check = await checkSession();

  if (check.status === "stale") {
    redirect(CLEAR_SESSION_PATH);
  }

  if (check.status === "valid") {
    redirect("/dashboard");
  }
}
