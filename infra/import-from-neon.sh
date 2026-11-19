#!/usr/bin/env bash
# Однократный перенос данных из Neon в PostgreSQL на сервере.
#
# Запуск на сервере из /opt/sfera, когда контейнеры уже подняты (docker compose up -d):
#   NEON_URL='postgresql://...neon.tech/neondb?sslmode=require' bash infra/import-from-neon.sh
#
# NEON_URL — строка DIRECT_URL из Vercel/Neon (без "-pooler" в адресе).
# Скрипт:
#   1) делает дамп Neon,
#   2) останавливает сайт,
#   3) ПОЛНОСТЬЮ очищает базу на сервере и загружает в неё дамп,
#   4) запускает сайт обратно.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${NEON_URL:-}" ]; then
  echo "Укажите NEON_URL='postgresql://...'" >&2
  exit 1
fi

# Читаем нужные значения из .env, не выполняя его как скрипт
env_get() { { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']$//"; }
DB_USER=$(env_get POSTGRES_USER)
DB_USER="${DB_USER:-sfera}"
DB_NAME=$(env_get POSTGRES_DB)
DB_NAME="${DB_NAME:-sfera}"

mkdir -p infra/backups
DUMP="infra/backups/neon_$(date +%Y-%m-%d_%H-%M).sql"

echo "==> Дамп из Neon"
docker run --rm postgres:17-alpine pg_dump "$NEON_URL" --no-owner --no-acl --schema=public > "$DUMP"
echo "    сохранён: $DUMP ($(du -h "$DUMP" | cut -f1))"

read -r -p "База '$DB_NAME' на сервере будет очищена и заменена данными из Neon. Продолжить? [y/N] " answer
if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
  echo "Отменено. Дамп остался в $DUMP"
  exit 0
fi

echo "==> Останавливаем сайт"
docker compose stop app

echo "==> Очищаем схему public и загружаем дамп"
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$DUMP"

echo "==> Запускаем сайт (prisma db push добавит новые таблицы, например RateLimit)"
docker compose start app

echo "==> Проверка: число преподавателей и учеников"
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c \
  'SELECT (SELECT count(*) FROM "Teacher") AS teachers, (SELECT count(*) FROM "Student") AS students;'

echo "Готово."
