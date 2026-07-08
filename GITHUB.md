# Публикация на GitHub → Timeweb App Platform

## Шаг 1. Репозиторий на GitHub (один раз)

1. Откройте [github.com/new](https://github.com/new)
2. **Repository name:** `sfera` (или `sferaege`)
3. **Private** — рекомендуется (в `.env` секретов в репо нет)
4. **Не** ставьте README, .gitignore, license — проект уже готов локально
5. Нажмите **Create repository**

## Шаг 2. Залить код с ПК

В терминале в папке проекта (или попросите Cursor выполнить):

```powershell
cd "c:\Users\mixal\OneDrive\Рабочий стол\Progects\Russkii100"

git remote add origin https://github.com/Joni-1337/sfera.git
git branch -M main
git push -u origin main
```

Замените URL, если ваш логин GitHub другой (сейчас указан **Joni-1337** из настроек git на этом ПК).

При первом push GitHub попросит войти (браузер или токен).

### Если GitHub Desktop

1. **File → Add local repository** → выберите папку `Russkii100`
2. **Publish repository** → имя `sfera`, private
3. **Push origin**

## Шаг 3. Vercel (рекомендуется, бесплатно)

См. **[VERCEL.md](./VERCEL.md)** — Neon + Vercel + GitHub.

Кратко: [vercel.com/new](https://vercel.com/new) → Import `sfera` → env из `neon.env.example` + `JWT_SECRET`, `APP_URL`.

---

## Альтернатива: Timeweb Cloud → App Platform

1. [timeweb.cloud](https://timeweb.cloud) → **App Platform** → **Создать**
2. **Frontend → Next.js**
3. **Включить SSR** (обязательно!)
4. **Подключить GitHub** → выберите репозиторий `sfera`, ветка `main`
5. Настройки сборки:

| Поле | Значение |
|------|----------|
| Команда сборки | `npm run build` |
| Команда запуска | `npm run start:prod` |
| Node.js | 20 |

6. **Переменные окружения** — скопируйте из `timeweb.env.example`:

```
DATABASE_URL=<pooled Neon URL>
DIRECT_URL=<direct Neon URL>
JWT_SECRET=<сгенерируйте длинную случайную строку>
APP_URL=https://sferaege.ru
RESEND_API_KEY=
EMAIL_FROM=СФЕРА <noreply@sferaege.ru>
SUBSCRIPTION_STUB=true
PORT=3000
NODE_ENV=production
```

Пока домен не активен — после первого деплоя подставьте URL вида `https://....timeweb.cloud` в `APP_URL`.

7. **Заказать / Деплой** — дождитесь зелёного статуса

8. **Домены** → добавить `sferaege.ru` (когда DNS готов)

## Шаг 4. База (один раз после деплоя)

В консоли приложения Timeweb или через SSH:

```bash
npm run db:seed
```

Тестовый учитель: `teacher@example.com` / `teacher123`

## Обновления сайта

```powershell
git add .
git commit -m "Update"
git push
```

Timeweb с автодеплоем пересоберёт сайт сам.

---

## Частые проблемы

**Ошибка сборки Prisma** — в App Platform должны быть команды `npm run build` (там уже `prisma generate`).

**502 после деплоя** — проверьте команду запуска: `npm run start:prod`, порт `3000`.

**Email не работает** — нужен Resend + верификация домена `sferaege.ru`.
