"use client";

import "@/lib/metrika-types";

const COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);

export function reachMetrikaGoal(
  goal: string,
  params?: Record<string, unknown>
) {
  if (!COUNTER_ID || typeof window === "undefined" || !window.ym) return;
  window.ym(COUNTER_ID, "reachGoal", goal, params);
}
