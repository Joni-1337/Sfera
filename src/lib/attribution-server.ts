import { cookies } from "next/headers";
import {
  ATTRIBUTION_COOKIE,
  attributionToTeacherFields,
  parseAttributionCookie,
  type AttributionData,
} from "@/lib/attribution";

export async function getAttributionFromCookies(): Promise<AttributionData | null> {
  const raw = (await cookies()).get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return null;
  return parseAttributionCookie(raw);
}

export async function getTeacherSignupAttribution() {
  const attribution = await getAttributionFromCookies();
  return attributionToTeacherFields(attribution);
}
