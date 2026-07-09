import { APP_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import { SUBSCRIPTION_PRICE_RUB } from "@/lib/subscription-shared";

/** ФИО самозанятого (как в приложении «Мой налог») */
export const LEGAL_OPERATOR_FULL_NAME =
  process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() ||
  "Михалин Евгений Александрович";

/** ИНН самозанятого (12 цифр) */
export const LEGAL_INN =
  process.env.NEXT_PUBLIC_LEGAL_INN?.trim() || "324507422777";

/** Телефон для связи (необязательно) */
export const LEGAL_PHONE = process.env.NEXT_PUBLIC_LEGAL_PHONE?.trim() || "";

export const LEGAL_STATUS =
  "Самозанятый (плательщик налога на профессиональный доход)";

export const SITE_URL = process.env.APP_URL?.trim() || "https://sferaege.ru";

export const SUBSCRIPTION_PRODUCT_NAME = `Подписка преподавателя на платформу «${APP_NAME}»`;

export const SUBSCRIPTION_PRICE_LABEL = `${SUBSCRIPTION_PRICE_RUB.toLocaleString("ru-RU")} ₽ / 30 дней`;

export function isLegalInfoComplete() {
  return Boolean(LEGAL_OPERATOR_FULL_NAME && LEGAL_INN);
}
