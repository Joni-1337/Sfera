# Образ СФЕРЫ для своего сервера (Cloud.ru и любой VPS с Docker).
# Собирается командой: docker compose build

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && apt-get clean
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Зависимости (кэшируются, пока не менялись package*.json и схема)
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2. Сборка Next.js (output: "standalone")
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* встраиваются в код при сборке — передаются из .env через docker-compose
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUBSCRIPTION_PRICE_RUB
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID
ARG NEXT_PUBLIC_YANDEX_VERIFICATION
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NEXT_PUBLIC_TAWK_PROPERTY_ID
ARG NEXT_PUBLIC_TAWK_WIDGET_ID
ARG NEXT_PUBLIC_LEGAL_NAME
ARG NEXT_PUBLIC_LEGAL_INN
ARG NEXT_PUBLIC_LEGAL_PHONE
RUN npx prisma generate && npx next build

# 3. Отдельная установка Prisma CLI — нужна для `prisma db push` при старте
FROM base AS prisma-cli
WORKDIR /prisma-cli
COPY package.json /tmp/package.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/package.json').devDependencies.prisma.replace(/^[^0-9]*/, '')") \
  && npm init -y >/dev/null \
  && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}"

# 4. Итоговый лёгкий образ
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=prisma-cli /prisma-cli/node_modules /prisma-cli/node_modules
COPY infra/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
