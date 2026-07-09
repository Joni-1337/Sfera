"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);

declare global {
  interface Window {
    ym?: (id: number, method: string, url: string, options?: object) => void;
  }
}

export function YandexMetrikaTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!COUNTER_ID || !window.ym) return;

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.ym(COUNTER_ID, "hit", url);
  }, [pathname, searchParams]);

  return null;
}
