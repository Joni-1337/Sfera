#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "==> Node.js 20"
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> PM2"
sudo npm install -g pm2

echo "==> .env"
if [[ ! -f .env ]]; then
  cp .env.production.example .env
  echo "Создан .env — отредактируйте JWT_SECRET и APP_URL!"
fi

echo "==> Зависимости и сборка"
npm ci
npx prisma generate
npx prisma db push
npm run build

echo "==> PM2 start"
pm2 delete sfera 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Nginx (если установлен)"
if command -v nginx &>/dev/null; then
  sudo tee /etc/nginx/sites-available/sfera >/dev/null <<'NGINX'
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
NGINX
  sudo ln -sf /etc/nginx/sites-available/sfera /etc/nginx/sites-enabled/sfera
  sudo nginx -t && sudo systemctl reload nginx
fi

echo ""
echo "Готово. Сайт на порту 3000."
echo "SSL: sudo certbot --nginx -d sferaege.ru -d www.sferaege.ru"
echo "Seed: npm run db:seed"
