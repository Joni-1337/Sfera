export const ATTRIBUTION_COOKIE = "sfera_attr";

export type AttributionData = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
};

const MAX_FIELD_LENGTH = 255;

function trimField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_FIELD_LENGTH);
}

export function normalizeAttribution(
  data: Partial<AttributionData> | null | undefined
): AttributionData | null {
  if (!data) return null;

  const normalized: AttributionData = {
    utmSource: trimField(data.utmSource),
    utmMedium: trimField(data.utmMedium),
    utmCampaign: trimField(data.utmCampaign),
    utmContent: trimField(data.utmContent),
    utmTerm: trimField(data.utmTerm),
    referrer: trimField(data.referrer),
    landingPage: trimField(data.landingPage),
  };

  const hasValue = Object.values(normalized).some(Boolean);
  return hasValue ? normalized : null;
}

export function serializeAttribution(data: AttributionData): string {
  return JSON.stringify(normalizeAttribution(data));
}

export function parseAttributionCookie(raw: string): AttributionData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AttributionData>;
    return normalizeAttribution(parsed);
  } catch {
    return null;
  }
}

export function attributionToTeacherFields(data: AttributionData | null) {
  if (!data) return {};

  const fields = {
    signupUtmSource: data.utmSource,
    signupUtmMedium: data.utmMedium,
    signupUtmCampaign: data.utmCampaign,
    signupUtmContent: data.utmContent,
    signupUtmTerm: data.utmTerm,
    signupReferrer: data.referrer,
    signupLandingPage: data.landingPage,
  };

  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => Boolean(value))
  );
}
