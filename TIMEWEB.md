# Деплой СФЕРА на Timeweb Cloud → sferaege.ru

> **Важно:** обычный хостинг `*.tw1.ru` (виртуальный) **не подходит** для Next.js с сервером.
> Нужен **Timeweb Cloud → App Platform** (Next.js + SSR) **или** **облачный VPS**.

---

## Способ 1 — App Platform (рекомендуем, проще всего)

### 1. GitHub

1. Создайте репозиторий на GitHub (приватный или публичный).
2. В папке проекта на ПК:

```powershell
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/sfera.git
git push -u origin main
```

Или запустите: `powershell -File scripts/prepare-git.ps1`

### 2. Timeweb Cloud → App Platform → Создать

| Поле | Значение |
|------|----------|
| Тип | **Frontend → Next.js** |
| **SSR** | **Включить** (обязательно!) |
| Node.js | 20 |
| Репозиторий | ваш GitHub |
| Ветка | `main` |
| Команда сборки | `npm run build` |
| Команда запуска | `npm run start:prod` |
| Порт | `3000` (или как в панели) |

### 3. Переменные окружения (вкладка «Переменные»)

Скопируйте из `timeweb.env.example` и **обязательно** задайте свой `JWT_SECRET`:

```
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=<случайная строка 32+ символов>
APP_URL=https://sferaege.ru
RESEND_API_KEY=
EMAIL_FROM=СФЕРА <noreply@sferaege.ru>
SUBSCRIPTION_STUB=true
PORT=3000
```

Пока домен не активен: `APP_URL=https://ВАШ-URL.apps.timeweb.cloud` (URL даст Timeweb после деплоя).

### 4. Домен sferaege.ru

1. Timeweb Cloud → ваше приложение → **Домены** → добавить `sferaege.ru`
2. У регистратора домена: **A-запись** `@` → IP из панели Timeweb (или CNAME, как подскажет панель)
3. SSL включается в панели автоматически
4. Обновите `APP_URL=https://sferaege.ru` → **перезапуск** приложения

### 5. Первый запуск БД

После успешного деплоя один раз в консоли App Platform (или SSH к контейнеру):

```bash
npm run db:seed
```

(создаст тестового учителя `teacher@example.com` / `teacher123`)

---

## Способ 2 — VPS Timeweb Cloud (SSH)

### 1. Заказать VPS (Ubuntu 22.04, 2 GB RAM)

### 2. На ПК — создать архив

```powershell
powershell -File scripts/create-deploy-zip.ps1
```

Получите `deploy/sfera-deploy.zip`

### 3. Загрузить на сервер (WinSCP / FileZilla)

- Хост: IP VPS
- Путь: `/var/www/sfera`
- Распаковать zip

### 4. На сервере по SSH

```bash
chmod +x scripts/timeweb-vps-setup.sh
sudo ./scripts/timeweb-vps-setup.sh
```

Скрипт установит Node 20, PM2, Nginx, соберёт проект.

### 5. `.env` на сервере

```bash
cp .env.production.example .env
nano .env
```

### 6. Домен + SSL

```bash
sudo certbot --nginx -d sferaege.ru -d www.sferaege.ru
```

---

## Resend (почта)

После активации `sferaege.ru`:

1. [resend.com](https://resend.com) → Domains → Add `sferaege.ru`
2. DNS-записи у регистратора
3. `EMAIL_FROM=СФЕРА <noreply@sferaege.ru>`

---

## Обновление сайта

**App Platform:** `git push` → автодеплой

**VPS:**

```bash
cd /var/www/sfera
git pull   # или залить новый zip
npm ci && npm run build
pm2 restart sfera
```

---

## Чеклист

- [ ] Timeweb **Cloud** (не tw1.ru shared)
- [ ] SSR включён
- [ ] `JWT_SECRET` задан
- [ ] `APP_URL` = реальный URL
- [ ] Домен sferaege.ru привязан
- [ ] Resend после DNS
