#!/usr/bin/env bash
# Первичная настройка чистого сервера Ubuntu 22.04/24.04 под СФЕРУ.
# Запуск на сервере (под root или через sudo):
#   curl -fsSL https://raw.githubusercontent.com/Joni-1337/Sfera/main/infra/setup-server.sh | sudo bash
# (для приватного репозитория — скопируйте файл на сервер и запустите: sudo bash setup-server.sh)
set -euo pipefail

echo "==> Обновление пакетов"
apt-get update -y
apt-get upgrade -y

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Git"
apt-get install -y git

echo "==> Файл подкачки 2 ГБ (сборке Next.js нужна память)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

echo "==> Файрвол: SSH, HTTP, HTTPS"
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Автоматические обновления безопасности"
apt-get install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

echo
echo "Готово. Дальше — шаги из DEPLOY-RU.md (клонировать репозиторий в /opt/sfera, заполнить .env)."
