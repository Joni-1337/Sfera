# Деплой на Vercel + Neon (бесплатно)

Стек: **GitHub** → **Vercel** (Next.js) → **Neon** (PostgreSQL).

## 1. GitHub

См. [GITHUB.md](./GITHUB.md) — залейте репозиторий `sfera`.

## 2. Neon — база данных

1. [neon.tech](https://neon.tech) — проект уже создан
2. **Connection details** → скопируйте две строки:
   - **Pooled** → `DATABASE_URL` (для Vercel)
   - **Direct** → `DIRECT_URL` (для миграций Prisma)

Локально и на Vercel нужны **обе** переменные (см. `neon.env.example`).

### Первичная настройка БД (один раз)

```powershell
cd "c:\Users\mixal\OneDrive\Рабочий стол\Progects\Russkii100"

# В .env должны быть DATABASE_URL и DIRECT_URL (direct-строка Neon)
npm run db:push
npm run db:seed
```

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → `sfera`
2. Framework: **Next.js** (определится автоматически)
3. **Environment Variables** (Production):

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Pooled connection string из Neon |
| `DIRECT_URL` | Direct connection string из Neon |
| `JWT_SECRET` | Длинная случайная строка (32+ символов) |
| `APP_URL` | `https://sferaege.ru` (или временный `https://xxx.vercel.app`) |
| `RESEND_API_KEY` | Ключ Resend (когда настроите) |
| `EMAIL_FROM` | `СФЕРА <noreply@sferaege.ru>` |
| `SUBSCRIPTION_STUB` | `true` (только для теста без ЮKassa) |
| `YOOKASSA_SHOP_ID` | shopId из [ЮKassa](https://yookassa.ru) (когда подключите) |
| `YOOKASSA_SECRET_KEY` | Секретный ключ ЮKassa |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | Property ID из [Tawk.to](https://www.tawk.to) (чат поддержки) |
| `NEXT_PUBLIC_TAWK_WIDGET_ID` | Widget ID (обычно `default`, см. Direct Chat Link) |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | `110556448` — счётчик [Яндекс.Метрики](https://metrika.yandex.ru) |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | `56b1dce39eea263b` — [Яндекс.Вебмастер](https://webmaster.yandex.ru) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | `23f5cs0J9pWbbq8wHJw1SIOqoRgqL1uWAzQW87IlrVc` — [Google Search Console](https://search.google.com/search-console) |
| `MARKETING_ADMIN_EMAIL` | Email владельца — доступ к `/admin/marketing` |
| `NEXT_PUBLIC_LEGAL_NAME` | ФИО самозанятого (как в «Мой налог») |
| `NEXT_PUBLIC_LEGAL_INN` | ИНН самозанятого (12 цифр) |

Подробная настройка оплаты: [PAYMENTS.md](./PAYMENTS.md)

4. **Deploy**

При каждом деплое Vercel выполнит `npm run build` — в нём есть `prisma db push` (синхронизация схемы с Neon).

### Seed на production (один раз)

После первого успешного деплоя:

```powershell
# Установите vercel CLI или используйте Neon SQL Editor + ручной seed
npx vercel env pull .env.production.local
npm run db:seed
```

Или локально с production `DATABASE_URL` / `DIRECT_URL` из Vercel:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:DIRECT_URL="postgresql://..."
npm run db:seed
```

Тестовый учитель: `teacher@example.com` / `teacher123`

## 4. Домен sferaege.ru

1. Vercel → Project → **Settings → Domains** → Add `sferaege.ru` и `www.sferaege.ru`
2. У регистратора домена — DNS по подсказкам Vercel (обычно A/CNAME)
3. Обновите `APP_URL=https://sferaege.ru` в Vercel → Redeploy

## 5. Регистрация преподавателя (Resend)

На production после регистрации уходит **письмо с подтверждением email**. Нужны переменные в Vercel:

| Переменная | Значение |
|------------|----------|
| `RESEND_API_KEY` | API Keys → Create на [resend.com](https://resend.com) |
| `EMAIL_FROM` | `СФЕРА <noreply@sferaege.ru>` |
| `APP_URL` | `https://sferaege.ru` (или ваш `.vercel.app` URL) |

### Подключить домен в Resend

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** → `sferaege.ru`
2. Resend покажет DNS-записи (обычно **TXT** для DKIM и **MX** для отправки)
3. В Timeweb → **Редактор DNS** → **+ Добавить запись** (A-запись Vercel `76.76.21.21` **не трогайте**)
4. Дождитесь статуса **Verified** в Resend
5. Vercel → **Redeploy**

### Быстрый тест (до верификации домена)

Без своего домена Resend шлёт письма **только на email вашего аккаунта Resend**.

- `EMAIL_FROM` = `СФЕРА <onboarding@resend.dev>`
- Регистрируйтесь на сайте с **тем же email**, что в Resend

### Проверка

1. `/register` → ФИО, email, пароль
2. Страница «Проверьте почту»
3. Ссылка в письме → `/verify-email` → вход в кабинет

## 6. Email (Resend) — полная настройка

После привязки домена — верифицируйте `sferaege.ru` в [resend.com](https://resend.com) и добавьте DNS-записи.

## Обновления

```powershell
git add .
git commit -m "Update"
git push
```

Vercel пересоберёт сайт автоматически.

---

## Лимиты бесплатного плана

- **Vercel Hobby** — достаточно для старта; коммерческий трафик — платный план
- **Neon Free** — ~0.5 GB, автопауза при простое (первый запрос может быть медленнее)

## Timeweb vs Vercel

| | Vercel + Neon | Timeweb VPS |
|---|---|---|
| Цена | Бесплатно (старт) | Платно |
| Next.js | Нативно | Ручная настройка |
| БД | PostgreSQL (Neon) | SQLite или Postgres |

Проект настроен под **PostgreSQL** — SQLite больше не используется.

## 7. SEO и аналитика

### Яндекс.Метрика (все визиты и источники)

1. [metrika.yandex.ru](https://metrika.yandex.ru) → создайте счётчик для `sferaege.ru`
2. Vercel → `NEXT_PUBLIC_YANDEX_METRIKA_ID` = номер счётчика → Redeploy
3. В Метрике: **Настройки → Цели** — создайте цели:
   - `pricing_view` — просмотр тарифов
   - `registration_submit` — отправка регистрации
   - `registration_complete` — подтверждение email
   - `payment_checkout_start` — переход к оплате (кнопка «Оформить» / «Продлить» / «Продолжить оплату»)

### Источники регистраций (UTM в базе)

При регистрации сохраняются UTM-метки и referrer. Смотреть:

- Vercel → `MARKETING_ADMIN_EMAIL` = ваш email преподавателя
- Откройте **`/admin/marketing`** после входа

Пример ссылки для рекламы:

`https://sferaege.ru/?utm_source=yandex&utm_medium=cpc&utm_campaign=ege_rus`

### Индексация в Яндекс и Google

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → добавьте сайт → скопируйте код верификации → `NEXT_PUBLIC_YANDEX_VERIFICATION` в Vercel
2. [search.google.com/search-console](https://search.google.com/search-console) → то же → `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
3. Отправьте sitemap: **`https://sferaege.ru/sitemap.xml`**
4. Redeploy

На сайте уже есть: `robots.txt`, sitemap, Open Graph, JSON-LD, canonical URL, `noindex` для кабинета.

### Продвижение (вне кода)

- Заполните описание на главной и в карточках возможностей ключевыми запросами («ЕГЭ русский», «платформа для репетитора»)
- Регулярно публикуйте полезный контент (статьи, кейсы) — отдельные landing-страницы при необходимости
- Яндекс.Бизнес / 2GIS — карточка сервиса
- Внешние ссылки с тематических сайтов и профилей репетиторов
