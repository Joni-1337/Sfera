import Script from "next/script";
import "@/lib/tawk-types";

const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim();
const TAWK_WIDGET_ID =
  process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim() || "default";

/**
 * Английское приветствие «Hi! How can we help?» задаётся в кабинете Tawk.to
 * (Administration → Triggers → Welcome message). Отключите его, чтобы не
 * дублировать русское приветствие TawkWelcomePrompt на сайте.
 */
export function TawkWidget() {
  if (!TAWK_PROPERTY_ID) return null;

  const embedSrc = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src="${embedSrc}";
          s1.charset="UTF-8";
          s1.setAttribute("crossorigin","*");
          s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}
