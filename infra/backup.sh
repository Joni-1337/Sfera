#!/usr/bin/env bash
# Ежедневный бэкап базы СФЕРЫ. Хранит последние 14 копий в /opt/sfera/infra/backups.
# Подключение в cron (раз в сутки в 03:30):
#   (crontab -l 2>/dev/null; echo "30 3 * * * /opt/sfera/infra/backup.sh >> /var/log/sfera-backup.log 2>&1") | crontab -
#
# ВАЖНО: копии на том же сервере не спасут, если сервер пропадёт.
# Раз в неделю скачивайте свежий файл к себе (см. DEPLOY-RU.md) или
# настройте выгрузку в объектное хранилище.
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="infra/backups"
KEEP=14
mkdir -p "$BACKUP_DIR"

# Читаем нужные значения из .env, не выполняя его как скрипт
env_get() { { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']$//"; }
POSTGRES_USER=$(env_get POSTGRES_USER)
POSTGRES_DB=$(env_get POSTGRES_DB)

STAMP=$(date +%Y-%m-%d_%H-%M)
FILE="$BACKUP_DIR/sfera_$STAMP.sql.gz"

docker compose exec -T db pg_dump -U "${POSTGRES_USER:-sfera}" -d "${POSTGRES_DB:-sfera}" --no-owner --no-acl \
  | gzip > "$FILE"

echo "$(date -Is) бэкап: $FILE ($(du -h "$FILE" | cut -f1))"

# Удаляем старые копии, оставляя последние $KEEP
ls -1t "$BACKUP_DIR"/sfera_*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm --
