import { Suspense } from "react";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { YandexMetrikaTracker } from "@/components/analytics/YandexMetrikaTracker";

export function Analytics() {
  return (
    <>
      <YandexMetrika />
      <AttributionCapture />
      <Suspense fallback={null}>
        <YandexMetrikaTracker />
      </Suspense>
    </>
  );
}
