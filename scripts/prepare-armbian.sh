#!/usr/bin/env sh
# Run this once on the Armbian device from the extracted project directory.
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker Engine and Docker Compose plugin…"
  curl -fsSL https://get.docker.com | sh
  echo "Docker was installed. Run 'newgrp docker' (or sign out/in), then run this script again."
  exit 0
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is unavailable. Install docker-compose-plugin, then rerun this script."
  exit 1
fi

if [ ! -f .env ]; then
  printf 'Public domain (for example blog.example.com): '
  read -r domain
  printf 'Email for Let\047s Encrypt notices: '
  read -r email
  printf 'Administrator username [admin]: '
  read -r admin_user
  admin_user=${admin_user:-admin}
  printf 'Administrator password: '
  stty -echo
  read -r admin_password
  stty echo
  printf '\n'
  if [ -z "$domain" ] || [ -z "$email" ] || [ -z "$admin_password" ]; then
    echo "Domain, email, and administrator password cannot be empty."
    exit 1
  fi
  admin_hash=$(docker run --rm caddy:2-alpine caddy hash-password --plaintext "$admin_password")
  umask 077
  printf 'DOMAIN=%s\nACME_EMAIL=%s\nADMIN_USER=%s\nADMIN_PASSWORD_HASH=%s\n' "$domain" "$email" "$admin_user" "$admin_hash" > .env
  unset admin_password
fi

mkdir -p data uploads
docker compose up -d --build
docker compose ps
echo "Deployment started. Open https://$(sed -n 's/^DOMAIN=//p' .env) after DNS propagation."
