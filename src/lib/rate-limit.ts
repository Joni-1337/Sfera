import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Простой ограничитель попыток на базе Postgres (работает и при нескольких
 * инстансах сервера, в отличие от счётчика в памяти).
 *
 * Для входа считаем только НЕУДАЧНЫЕ попытки: так класс, который заходит
 * с одного школьного Wi-Fi (один IP), не блокирует сам себя.
 */

const MINUTE = 60 * 1000;

export const RATE_LIMITS = {
  /** Неверный ключ/имя ученика с одного IP. */
  studentLoginIp: { limit: 20, windowMs: 15 * MINUTE },
  /** Попытки подобрать имя к конкретному ключу. */
  studentLoginKey: { limit: 10, windowMs: 15 * MINUTE },
  /** Неверный пароль к конкретному email. */
  teacherLoginEmail: { limit: 8, windowMs: 15 * MINUTE },
  /** Неверный пароль с одного IP (перебор по многим email). */
  teacherLoginIp: { limit: 30, windowMs: 15 * MINUTE },
  /** Письма (подтверждение, сброс пароля) на один адрес. */
  emailSendAddress: { limit: 3, windowMs: 15 * MINUTE },
  /** Письма с одного IP. */
  emailSendIp: { limit: 10, windowMs: 15 * MINUTE },
  /** Регистрации с одного IP. */
  registerIp: { limit: 5, windowMs: 60 * MINUTE },
} as const;

export type RateLimitRule = { limit: number; windowMs: number };

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

/** true, если лимит по ключу уже исчерпан (счётчик не меняется). */
export async function isRateLimited(key: string, rule: RateLimitRule): Promise<boolean> {
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt.getTime() <= Date.now()) return false;
    return row.count >= rule.limit;
  } catch (error) {
    // Ограничитель не должен ронять вход, если таблица ещё не создана.
    console.error("[rate-limit] check failed", error);
    return false;
  }
}

/** Засчитать попытку. */
export async function hitRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  const now = Date.now();
  const resetAt = new Date(now + rule.windowMs);
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt.getTime() <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    } else {
      await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
    }

    // Изредка подчищаем устаревшие записи, чтобы таблица не росла.
    if (Math.random() < 0.02) {
      await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now) } } });
    }
  } catch (error) {
    console.error("[rate-limit] hit failed", error);
  }
}

/** Проверить и сразу засчитать попытку. Возвращает true, если лимит превышен. */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<boolean> {
  if (await isRateLimited(key, rule)) return true;
  await hitRateLimit(key, rule);
  return false;
}

export async function clearRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("[rate-limit] clear failed", error);
  }
}

export const TOO_MANY_ATTEMPTS =
  "Слишком много попыток. Подождите 15 минут и попробуйте снова.";
