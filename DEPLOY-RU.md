# Переезд СФЕРЫ на российские серверы

Цель: сайт открывается в России **без VPN**, данные пользователей хранятся в РФ (152-ФЗ), стоимость на старте почти нулевая.

## Что на что меняем

| Было | Стало | Почему |
|------|-------|--------|
| Vercel (сайт) | **Cloud.ru Evolution, бесплатная ВМ** + Docker | IP-адреса Vercel частично блокируются в РФ |
| Neon, США (база) | **PostgreSQL 17 на той же ВМ** | данные в РФ, база рядом с сайтом — быстрее |
| Resend (почта) | **российский SMTP-сервис** (Selectel, Unisender Go, SMTP.bz…) | работает без ограничений, оплата из РФ |
| ЮKassa, Яндекс Метрика | без изменений | уже российские |
| Tawk.to (чат) | по желанию отключить | зарубежный скрипт, не обязателен |

**Сколько стоит:** ВМ из free tier Cloud.ru бесплатна (2 vCPU, 4 ГБ RAM, 30 ГБ диска), но **публичный IP-адрес оплачивается отдельно** по тарифу — проверьте цену в калькуляторе Cloud.ru. У почтовых сервисов есть бесплатные лимиты (например, у Selectel первые 1 000 писем в месяц), для старта этого хватает.

**Ограничения бесплатной ВМ:** гарантирована только доля процессора (до 10%), поэтому сборка сайта может идти 10–20 минут, а при росте нагрузки понадобится платная ВМ. Условия акции действуют до 31.12.2026 — проверьте их перед продлением. Когда пользователей станет больше, тот же Docker-набор переносится на любой платный VPS (Cloud.ru, Timeweb, Selectel) без изменений в коде.

---

## Шаг 1. Сервер в Cloud.ru

1. Зарегистрируйтесь на [cloud.ru](https://cloud.ru) → **Evolution** → подключите **free tier**.
2. Создайте виртуальную машину по конфигурации free tier:
   - ОС: **Ubuntu 24.04** (или 22.04)
   - Диск: 30 ГБ
   - **Публичный IP**: включить
   - Доступ: **SSH-ключ** (не пароль)
3. В группе безопасности откройте входящие порты **22, 80, 443**.
4. Подключитесь: `ssh ubuntu@IP_СЕРВЕРА`.

## Шаг 2. Подготовка сервера

```bash
sudo apt-get update && sudo apt-get install -y git
sudo git clone https://github.com/Joni-1337/Sfera.git /opt/sfera
sudo chown -R $USER:$USER /opt/sfera
sudo bash /opt/sfera/infra/setup-server.sh
sudo usermod -aG docker $USER   # затем выйдите и зайдите по SSH заново
```

Репозиторий приватный? Тогда для клонирования нужен [deploy key](https://docs.github.com/ru/authentication/connecting-to-github-with-ssh/managing-deploy-keys) (ключ только на чтение) и адрес `git@github.com:Joni-1337/Sfera.git`.

`setup-server.sh` ставит Docker, файрвол (только SSH/HTTP/HTTPS), файл подкачки 2 ГБ и автообновления безопасности.

## Шаг 3. Настройки (.env)

```bash
cd /opt/sfera
cp infra/server.env.example .env
openssl rand -hex 24   # → POSTGRES_PASSWORD
nano .env
```

Пока основной домен смотрит на Vercel, проверяем новый сервер на **поддомене**. У регистратора домена добавьте запись **A**: `new.sferaege.ru` → IP сервера. HTTPS нужен обязательно: без него браузер не сохранит cookie входа.

Обязательно заполнить:
- `SITE_DOMAIN=new.sferaege.ru`
- `APP_URL=https://new.sferaege.ru` (после переключения домена — `https://sferaege.ru`)
- `POSTGRES_PASSWORD` — из команды выше
- `JWT_SECRET` — **тот же, что на Vercel** (тогда никого не разлогинит). Если Vercel показывает `[encrypted]`, снимите у переменной флаг Sensitive или создайте новый: `openssl rand -hex 32` — все просто войдут заново
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` — из личного кабинета ЮKassa
- SMTP — см. шаг 5 (можно позже: без почты не будут приходить письма регистрации и сброса пароля)

## Шаг 4. Запуск и перенос данных из Neon

```bash
cd /opt/sfera
docker compose up -d --build      # первая сборка — до 20 минут
docker compose logs -f app        # ждём "Ready" и выходим Ctrl+C
```

Откройте `https://new.sferaege.ru` — должна открыться главная страница с замком HTTPS.

Перенос базы (в Neon берите строку **DIRECT_URL**, без `-pooler`):

```bash
NEON_URL='postgresql://USER:PASSWORD@ep-....neon.tech/neondb?sslmode=require' bash infra/import-from-neon.sh
```

Скрипт сделает дамп Neon, спросит подтверждение, заменит пустую базу на сервере данными и покажет число преподавателей и учеников. Сверьте их с данными в Neon.

**Проверьте без VPN** (лучше с мобильного интернета): вход преподавателя, вход ученика по ключу, прохождение задания.

## Шаг 5. Почта через российский SMTP

1. Зарегистрируйтесь в одном из сервисов: Selectel (SMTP), Unisender Go, SMTP.bz, Яндекс Cloud Postbox.
2. Добавьте домен `sferaege.ru` и пропишите у регистратора домена DNS-записи, которые выдаст сервис (**SPF, DKIM**, по возможности **DMARC**). Без них письма будут попадать в спам.
3. Впишите в `.env` значения `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` и перезапустите сайт: `docker compose up -d`.
4. Проверьте «Забыли пароль?» на своём email.

Когда задан `SMTP_HOST`, сайт отправляет письма через SMTP, иначе — через Resend, как раньше.

## Шаг 6. Переключение домена sferaege.ru

1. В DNS у регистратора: записи **A** для `sferaege.ru` и `www` → IP сервера. Старые записи Vercel удалить.
2. В `.env` (поддомен `new` можно оставить в списке или убрать):
   ```
   SITE_DOMAIN=sferaege.ru, www.sferaege.ru
   APP_URL=https://sferaege.ru
   ```
3. `docker compose up -d --build` — `APP_URL` встраивается в сборку, поэтому нужна пересборка. Caddy сам получит HTTPS-сертификат за 1–2 минуты после обновления DNS.
4. ЮKassa → Настройки → HTTP-уведомления: `https://sferaege.ru/api/payments/yookassa`.
5. Яндекс Вебмастер: проверьте, что сайт доступен и sitemap читается.

После этого проект на Vercel можно остановить, а базу в Neon удалить — **не раньше чем через пару недель**, когда убедитесь, что всё работает и бэкапы делаются.

## Шаг 7. Бэкапы (обязательно)

```bash
chmod +x /opt/sfera/infra/backup.sh
/opt/sfera/infra/backup.sh             # проверка вручную
(crontab -l 2>/dev/null; echo "30 3 * * * /opt/sfera/infra/backup.sh >> /var/log/sfera-backup.log 2>&1") | crontab -
```

Копии лежат в `/opt/sfera/infra/backups`, хранятся последние 14. Раз в неделю скачивайте свежую копию к себе:

```bash
scp ubuntu@IP_СЕРВЕРА:/opt/sfera/infra/backups/sfera_*.sql.gz .
```

Восстановление из копии:

```bash
gunzip -c infra/backups/sfera_ДАТА.sql.gz | docker compose exec -T db psql -U sfera -d sfera
```

## Шаг 8. Автодеплой из GitHub (по желанию)

После каждого push в `main` сервер сам обновит код и пересоберёт сайт.

1. На сервере создайте ключ для GitHub Actions:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
   cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/github_deploy      # это приватный ключ → в секрет SERVER_SSH_KEY
   ```
2. GitHub → репозиторий → Settings → Secrets and variables → Actions:
   - Secrets: `SERVER_HOST` (IP), `SERVER_USER` (`ubuntu`), `SERVER_SSH_KEY`
   - Variables: `DEPLOY_ENABLED` = `true`

Без ручной настройки можно обновлять так: `cd /opt/sfera && git pull && docker compose up -d --build`.

---

## Частые проблемы

| Симптом | Что делать |
|---------|-----------|
| `docker compose up` пишет «Задайте POSTGRES_PASSWORD/SITE_DOMAIN» | не заполнен `.env` |
| Сайт не стартует, в логах `JWT_SECRET не задан` | заполнить `JWT_SECRET` в `.env` |
| В логах `prisma db push` ругается на потерю данных | изменение схемы удаляет данные — сначала сделайте бэкап и разберитесь, какое поле меняется |
| Нет HTTPS | DNS ещё не обновился или закрыты порты 80/443 в группе безопасности Cloud.ru |
| Сборка падает по памяти | проверьте, что включён swap: `swapon --show` |
| Письма не приходят | `docker compose logs app \| grep email`, проверьте SPF/DKIM у SMTP-сервиса |

Полезные команды:

```bash
docker compose ps                 # что запущено
docker compose logs -f app        # логи сайта
docker compose restart app        # перезапуск сайта
docker compose exec db psql -U sfera -d sfera   # консоль базы
```
