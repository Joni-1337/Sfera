export type AdminDashboardLink = {
  label: string;
  href: string;
  hint: string;
};

export type AdminDashboardGroup = {
  title: string;
  description: string;
  links: AdminDashboardLink[];
};

export function getAdminDashboardGroups(metrikaId?: string): AdminDashboardGroup[] {
  return [
    {
      title: "Аналитика и SEO",
      description: "Все визиты, поиск, источники трафика",
      links: [
        {
          label: "Яндекс.Метрика",
          href: metrikaId
            ? `https://metrika.yandex.ru/dashboard?id=${metrikaId}`
            : "https://metrika.yandex.ru",
          hint: "Все посетители, страницы, карта кликов, цели",
        },
        {
          label: "Яндекс.Вебmaster",
          href: "https://webmaster.yandex.ru",
          hint: "Индексация в Яндексе, sitemap, ошибки",
        },
        {
          label: "Google Search Console",
          href: "https://search.google.com/search-console",
          hint: "Индексация в Google, клики из поиска",
        },
        {
          label: "Sitemap сайта",
          href: "https://sferaege.ru/sitemap.xml",
          hint: "Отправьте этот URL в оба вебmaster'а",
        },
      ],
    },
    {
      title: "Инфраструктура",
      description: "Деплой, база, письма",
      links: [
        {
          label: "Vercel",
          href: "https://vercel.com/dashboard",
          hint: "Деплой, переменные окружения, домен sferaege.ru",
        },
        {
          label: "Neon",
          href: "https://console.neon.tech",
          hint: "PostgreSQL — база пользователей и данных",
        },
        {
          label: "Resend",
          href: "https://resend.com/emails",
          hint: "Письма: регистрация, сброс пароля, оплата",
        },
        {
          label: "GitHub",
          href: "https://github.com/Joni-1337/Sfera",
          hint: "Исходный код, push → автодеплой",
        },
      ],
    },
    {
      title: "Оплата и поддержка",
      description: "Деньги и чат с пользователями",
      links: [
        {
          label: "ЮKassa",
          href: "https://yookassa.ru/my",
          hint: "Платежи, webhook, тестовые оплаты",
        },
        {
          label: "Tawk.to",
          href: "https://dashboard.tawk.to",
          hint: "Чат поддержки на сайте",
        },
      ],
    },
  ];
}

export const UTM_FIELD_HINTS: Record<string, string> = {
  "utm_source":
    "Откуда пришёл: yandex, google, vk, telegram, instagram",
  "utm_medium":
    "Тип канала: cpc (реклама), social, email, referral",
  "utm_campaign":
    "Название кампании: ege_rus, trial_march и т.д.",
  "Страница входа":
    "Первая страница при визите до регистрации: /, /pricing",
};

export const UTM_EXAMPLE =
  "https://sferaege.ru/?utm_source=yandex&utm_medium=cpc&utm_campaign=ege_rus";
