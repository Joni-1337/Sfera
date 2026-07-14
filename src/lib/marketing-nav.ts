/** Основные разделы для шапки, футера и JSON-LD — помогают роботу понять структуру сайта. */
export const MARKETING_NAV_LINKS = [
  { label: "ЕГЭ русский", path: "/ege-russkiy", navKey: "ege-russkiy" },
  { label: "Тарифы", path: "/pricing", navKey: "pricing" },
] as const;

export type MarketingNavKey = "home" | "pricing" | "ege-russkiy";
