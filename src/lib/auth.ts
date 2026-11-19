import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

let cachedSecret: Uint8Array | null = null;

/**
 * Секрет для подписи сессий. В продакшене без JWT_SECRET (или с коротким)
 * приложение отказывается работать: иначе любой мог бы подделать вход,
 * зная запасной секрет из исходного кода.
 */
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";
  if (!fromEnv) {
    if (isProd) {
      throw new Error("JWT_SECRET не задан. Задайте его в переменных окружения.");
    }
    console.warn("[auth] JWT_SECRET не задан — используется небезопасный секрет для разработки");
  } else if (fromEnv.length < 32) {
    console.error("[auth] JWT_SECRET короче 32 символов — замените на длинную случайную строку");
  }
  cachedSecret = new TextEncoder().encode(fromEnv || "dev-secret-only-for-local-development");
  return cachedSecret;
}

export type SessionPayload = {
  role: "teacher" | "student";
  id: string;
  name: string;
  email?: string;
  groupId?: string;
  groupName?: string;
};

const COOKIE_NAME = "russkii100_session";

export async function buildSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    },
  };
}

export async function createSession(payload: SessionPayload) {
  const cookie = await buildSessionCookie(payload);
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Сессия преподавателя для server actions. Дополнительно проверяем, что
 * аккаунт ещё существует: cookie живёт 7 дней и переживает удаление аккаунта.
 */
export async function requireTeacher() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || !session.id) {
    return null;
  }
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { id: true, emailVerified: true },
  });
  if (!teacher || !teacher.emailVerified) {
    return null;
  }
  return session;
}
