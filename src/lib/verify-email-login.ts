import "server-only";

import { createSession } from "@/lib/auth";
import { verifyEmailToken } from "@/lib/email-verification";

export async function completeEmailVerification(token: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    return { error: "Ссылка недействительна" as const };
  }

  const result = await verifyEmailToken(trimmed);
  if ("error" in result) {
    return { error: result.error };
  }

  await createSession({
    role: "teacher",
    id: result.teacher.id,
    name: result.teacher.fullName,
    email: result.teacher.email,
  });

  return { success: true as const };
}
