import Script from "next/script";

const JIVO_WIDGET_ID = process.env.NEXT_PUBLIC_JIVO_WIDGET_ID?.trim();

export function JivoWidget() {
  if (!JIVO_WIDGET_ID) return null;

  return (
    <Script
      id="jivo-chat"
      src={`https://code.jivo.ru/widget/${JIVO_WIDGET_ID}`}
      strategy="lazyOnload"
    />
  );
}
