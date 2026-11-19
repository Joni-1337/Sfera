# Деплой СФЕРА на ONREZA (РФ, бесплатный старт)

Сайт на Vercel из РФ часто не открывается без VPN. **ONREZA** — серверы в Москве, Next.js SSR, GitHub, бесплатный старт без карты.

Документация: [docs.onreza.ru](https://docs.onreza.ru/) · [Next.js](https://onreza.ru/frameworks/nextjs.html)

Репозиторий: `https://github.com/Joni-1337/Sfera`

---

## 1. Регистрация и GitHub

1. Откройте [app.onreza.ru](https://app.onreza.ru) → войдите через **GitHub**.
2. Workspace → **Settings → Git** → **Install GitHub App**.
3. Выберите репозиторий **`Joni-1337/Sfera`** (или «All repositories»).

---

## 2. Создать проект

1. **New Project** / **Создать проект**.
2. Импорт: `Joni-1337/Sfera`, ветка `main`.
3. Framework: **Next.js** (обычно автодетект).
4. Build settings (если спросит):

| Поле | Значение |
|------|----------|
| Install | `npm install` |
| Build | `npm run build` |
| Node | **20** |
| Output | `.next` (SSR / Compute) |

Пока **не** подключайте `sferaege.ru` — сначала добейтесь работы на `*.onreza.app`.

---

## 3. Переменные окружения

Project → **Settings → Environment Variables** → для **Production** (и Preview при желании).

Скопируйте значения **из Vercel** (те же, что на проде), минимум:

```env
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
APP_URL=https://ВАШ-проект.onreza.app
NODE_ENV=production
SUBSCRIPTION_PRICE_RUB=1990
NEXT_PUBLIC_SUBSCRIPTION_PRICE_RUB=1990
```

Опционально (как на Vercel):

```env
RESEND_API_KEY=...
EMAIL_FROM=СФЕРА <noreply@sferaege.ru>
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
NEXT_PUBLIC_YANDEX_METRIKA_ID=...
NEXT_PUBLIC_TAWK_PROPERTY_ID=...
NEXT_PUBLIC_TAWK_WIDGET_ID=...
```

**Важно:**
- `DATABASE_URL` / `DIRECT_URL` — **та же Neon**, что на Vercel (одна база).
- `JWT_SECRET` — **тот же**, иначе сессии «разъедутся».
- `APP_URL` — сначала URL ONREZA; после привязки домена смените на `https://sferaege.ru`.
- Пока тестируете оплату: можно `SUBSCRIPTION_STUB=true`.

Полный список полей — `onreza.env.example`.

После сохранения env — **Redeploy**.

---

## 4. Деплой

- Push в `main` → production на ONREZA (если Auto Deploy включён).
- Или **Deploy** вручную в панели.
- Или CLI: `nrz login` → в корне проекта `nrz deploy`.

Успех: URL вида `https://….onreza.app`.

Проверьте **без VPN** с телефона/другого интернета.

---

## 5. Домен sferaege.ru (когда ONREZA стабильно открывается)

1. ONREZA → Project → **Domains** → добавить `sferaege.ru` и `www`.
2. У регистратора домена — DNS по подсказке ONREZA (A/CNAME).
3. Убрать/не использовать старые A-записи на IP **Vercel**.
4. В ONREZA и Vercel обновить `APP_URL=https://sferaege.ru`.
5. В ЮKassa webhook: `https://sferaege.ru/api/payments/yookassa`.

Vercel можно оставить как запасной `*.vercel.app` (код тот же), но **домен** в DNS — только на ONREZA.

---

## 6. Если билд падает

| Симптом | Что сделать |
|---------|-------------|
| Нет `DATABASE_URL` | Добавить env и redeploy (`build` делает `prisma db push`) |
| `startup timeout` | Убедиться, что не `next dev`; у нас `output: "standalone"` |
| Prisma / native | Node 20, в логах смотреть `prisma generate` |
| Пустой сайт / 500 | Logs в панели ONREZA; сверить env с Vercel |

---

## Переключение Vercel ↔ ONREZA

| Что | Как |
|-----|-----|
| Код | Один GitHub → оба хостинга |
| База | Одна Neon |
| Домен | DNS указывает на **один** хостинг |
| Быстрый откат | Вернуть DNS на Vercel (из РФ снова может понадобиться VPN) |
