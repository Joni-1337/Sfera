#!/bin/sh
set -e

# Приводим схему базы к prisma/schema.prisma (новые таблицы/поля).
# Без --accept-data-loss: если изменение может удалить данные, контейнер
# не стартует и в логах будет объяснение — это защита от потери данных.
if [ "${SKIP_DB_PUSH:-false}" != "true" ]; then
  echo "[entrypoint] prisma db push..."
  node /prisma-cli/node_modules/prisma/build/index.js db push --skip-generate --schema=./prisma/schema.prisma
fi

exec "$@"
