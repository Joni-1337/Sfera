import "server-only";

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

  return { success: true as const, teacher: result.teacher };
}
