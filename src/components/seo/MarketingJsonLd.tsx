import { APP_NAME } from "@/lib/branding";
import { SITE_URL, LEGAL_OPERATOR_FULL_NAME } from "@/lib/legal";
import {
  SUBSCRIPTION_PRICE_RUB,
  TRIAL_DAYS,
} from "@/lib/subscription-shared";
import { JsonLd } from "@/components/seo/JsonLd";

export function HomePageJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: SITE_URL,
      email: "sferaege@mail.ru",
      founder: LEGAL_OPERATOR_FULL_NAME,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: APP_NAME,
      url: SITE_URL,
      inLanguage: "ru-RU",
      description:
        "Платформа для преподавателей и учеников: группы, задания, тесты и аналитика для подготовки к ЕГЭ по русскому языку",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RUB",
        description: `Пробный период ${TRIAL_DAYS} дня для преподавателей`,
      },
    },
  ];

  return <JsonLd data={data} />;
}

export function PricingPageJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Подписка преподавателя на платформу «${APP_NAME}»`,
    description:
      "Полный доступ к группам, заданиям, тестам ЕГЭ, текстам и аналитике",
    brand: { "@type": "Brand", name: APP_NAME },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pricing`,
      priceCurrency: "RUB",
      price: SUBSCRIPTION_PRICE_RUB,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().slice(0, 10),
    },
  };

  return <JsonLd data={data} />;
}
