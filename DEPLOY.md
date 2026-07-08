# Деплой СФЕРА на sferaege.ru

Пока домен «на публикации», можно уже поднять сайт по **IP сервера** или временному адресу хостинга. Когда DNS заработает — поменять только `APP_URL` и перезапустить приложение.

## Что нужно на хостинге

- **Node.js 20+** (Next.js 15)
- **SSH** или панель с доступом к терминалу
- Минимум **512 MB RAM**, лучше 1 GB
- Подходит: VPS (Timeweb, Selectel, Beget VPS и т.д.)

> Обычный shared-хостинг без Node.js **не подойдёт** — нужен VPS или хостинг с Node.

---

## Шаг 1. Загрузить проект на сервер

### Вариант A — Git (удобнее)

На сервере:

```bash
git clone <ваш-репозиторий> /var/www/sfera
cd /var/www/sfera
```

### Вариант B — ZIP с ПК

1. На ПК: архив папки проекта **без** `node_modules` и `.next`
2. Загрузить на сервер через SFTP (FileZilla, WinSCP) в `/var/www/sfera`
3. На сервере: `cd /var/www/sfera`

---

## Шаг 2. Настроить окружение

```bash
cp .env.production.example .env
nano .env   # или через панель хостинга
```

Обязательно задайте:

| Переменная | Значение |
|------------|----------|
| `JWT_SECRET` | Длинная случайная строка (32+ символов) |
| `APP_URL` | `https://sferaege.ru` (или `http://IP:3000` пока DNS не готов) |
| `DATABASE_URL` | `file:./prisma/prod.db` |
| `RESEND_API_KEY` | Ключ из resend.com (когда домен подтвердят) |
| `EMAIL_FROM` | `СФЕРА <noreply@sferaege.ru>` |

---

## Шаг 3. Сборка и база

```bash
npm ci
npx prisma generate
npx prisma db push
npm run db:seed          # опционально: тестовый учитель
npm run build
```

Если `npm run build` падает на ESLint — сообщите, исправим (локально уже чиним).

---

## Шаг 4. Запуск

### PM2 (рекомендуется)

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # автозапуск после перезагрузки сервера
```

Сайт слушает порт **3000**.

### Без PM2 (проверка)

```bash
npm start
```

---

## Шаг 5. Nginx + HTTPS (домен sferaege.ru)

Когда DNS у регистратора укажет на IP сервера:

**A-запись:** `sferaege.ru` → IP вашего VPS  
**A-запись:** `www` → тот же IP (или CNAME на `sferaege.ru`)

Пример конфига Nginx (`/etc/nginx/sites-available/sfera`):

```nginx
server {
    listen 80;
    server_name sferaege.ru www.sferaege.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL (Let's Encrypt):

```bash
sudo certbot --nginx -d sferaege.ru -d www.sferaege.ru
```

После SSL в `.env` должно быть `APP_URL=https://sferaege.ru`, затем:

```bash
pm2 restart sfera
```

---

## Шаг 6. Resend (email)

1. [resend.com](https://resend.com) → Domains → Add `sferaege.ru`
2. Добавить DNS-записи (SPF, DKIM) у регистратора домена
3. Дождаться **Verified**
4. В `.env`: `EMAIL_FROM="СФЕРА <noreply@sferaege.ru>"`

---

## Пока домен не готов

1. Откройте сайт по `http://ВАШ_IP:3000`
2. В `.env`: `APP_URL=http://ВАШ_IP:3000`
3. Email через Resend не заработает до верификации домена — регистрация с локальной кнопкой подтверждения в dev не будет на production; нужен Resend или временно `NODE_ENV` не production (не рекомендуется)

Для production без email: можно временно не включать `EMAIL_FORCE_RESEND` и дождаться DNS + Resend.

---

## Обновление после изменений в коде

```bash
cd /var/www/sfera
git pull                  # или залить новые файлы
npm ci
npx prisma db push
npm run build
pm2 restart sfera
```

---

## Чеклист

- [ ] VPS с Node.js 20+
- [ ] Проект на сервере
- [ ] `.env` с `JWT_SECRET` и `APP_URL`
- [ ] `npm run build` успешен
- [ ] PM2 запущен
- [ ] DNS A-запись на IP
- [ ] Nginx + certbot
- [ ] Resend + DNS для почты
