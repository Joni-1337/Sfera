"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  normalizeAttribution,
  parseAttributionCookie,
  serializeAttribution,
  type AttributionData,
} from "@/lib/attribution";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function readCookie(): AttributionData | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ATTRIBUTION_COOKIE}=([^;]*)`)
  );
  if (!match?.[1]) return null;
  return parseAttributionCookie(decodeURIComponent(match[1]));
}

function writeCookie(data: AttributionData) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
    serializeAttribution(data)
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const existing = readCookie();
    const hasUtm = UTM_KEYS.some((key) => params.has(key));

    if (existing && !hasUtm) return;

    const referrer = document.referrer || existing?.referrer || "";
    const isInternalReferrer = referrer.includes(window.location.hostname);

    const data = normalizeAttribution({
      utmSource: params.get("utm_source") ?? existing?.utmSource,
      utmMedium: params.get("utm_medium") ?? existing?.utmMedium,
      utmCampaign: params.get("utm_campaign") ?? existing?.utmCampaign,
      utmContent: params.get("utm_content") ?? existing?.utmContent,
      utmTerm: params.get("utm_term") ?? existing?.utmTerm,
      referrer:
        !isInternalReferrer && referrer ? referrer : existing?.referrer,
      landingPage:
        existing?.landingPage ||
        `${window.location.pathname}${window.location.search}`,
    });

    if (data) writeCookie(data);
  }, []);

  return null;
}
