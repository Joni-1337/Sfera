import "server-only";
import { APP_NAME, APP_TITLE } from "@/lib/branding";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Без своего домена: локально подтверждаем email ссылкой на странице, без Resend. */
export function usesLocalEmailVerification() {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.EMAIL_FORCE_RESEND === "true") return false;

  const from = process.env.EMAIL_FROM?.trim() ?? "";
  if (from.includes("@") && !from.includes("@resend.dev")) {
    return false;
  }

  return true;
}

function parseResendError(status: number, body: string): string {
  try {
    const data = JSON.parse(body) as { message?: string };
    const message = data.message ?? "";

    if (
      status === 403 &&
      message.includes("only send testing emails to your own email address")
    ) {
      const match = message.match(/\(([^)]+)\)/);
      const allowed = match?.[1];
      return allowed
        ? `Resend (тест): письмо можно отправить только на ${allowed}. Укажите этот email при регистрации или подключите домен в Resend.`
        : "Resend (тест): письмо можно отправить только на email вашего аккаунта Resend.";
    }

    if (status === 403 && message.toLowerCase().includes("domain")) {
      return "Домен для почты ещё не подтверждён в Resend. Дождитесь статуса Verified или проверьте EMAIL_FROM в Vercel.";
    }

    if (status === 422 && message.toLowerCase().includes("from")) {
      return "Некорректный адрес отправителя (EMAIL_FROM). Используйте: СФЕРА <noreply@sferaege.ru>";
    }

    if (message) return message;
  } catch {
    /* ignore */
  }

  return "Не удалось отправить письмо";
}

export function isResendSandboxRecipientError(status: number, body: string) {
  return (
    status === 403 &&
    body.includes("only send testing emails to your own email address")
  );
}

export async function sendEmail(input: SendEmailInput): Promise<
  | { ok: true }
  | { ok: false; error: string; status?: number; rawBody?: string }
> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email не настроен (RESEND_API_KEY)" };
  }

  const from = process.env.EMAIL_FROM?.trim() ?? `${APP_NAME} <onboarding@resend.dev>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] Resend error:", response.status, body);
      return {
        ok: false,
        error: parseResendError(response.status, body),
        status: response.status,
        rawBody: body,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: "Ошибка отправки письма" };
  }
}

export function appBaseUrl() {
  const configured = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

export async function sendVerificationEmail(to: string, verifyUrl: string, fullName: string) {
  const subject = `Подтвердите email — ${APP_TITLE}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #18181b;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">Здравствуйте, ${escapeHtml(fullName)}!</h1>
      <p style="line-height: 1.5; color: #52525b;">
        Спасибо за регистрацию на платформе <strong>${APP_NAME}</strong>.
        Подтвердите email, чтобы войти в личный кабинет преподавателя.
      </p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #14b8a6; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600;">
          Подтвердить email
        </a>
      </p>
      <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
        Ссылка действует 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.
      </p>
      <p style="font-size: 12px; color: #a1a1aa; word-break: break-all;">${verifyUrl}</p>
    </div>
  `;
  const text = `Подтвердите email: ${verifyUrl}`;

  return sendEmail({ to, subject, html, text });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
