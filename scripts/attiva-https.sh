#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) â€” ATTIVAZIONE HTTPS CON RETRY SUI 4 NAMESERVER ARUBA
# ==============================================================================
set -euo pipefail

DOMAIN="ristoreel.it"
SERVER_IP="72.62.156.177"
APP_DIR="/var/www/ristoreel.it"

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

echo "=================================================================="
echo "  ATTIVAZIONE HTTPS SU $DOMAIN E www.$DOMAIN"
echo "=================================================================="

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
fi

# Riprova automaticamente se il 2Â° nameserver di Aruba (dns2.technorail.com) sta ancora sincronizzando
for attempt in $(seq 1 30); do
  echo "[Tentativo $attempt/30] Richiesta certificato SSL Let's Encrypt per $DOMAIN e www.$DOMAIN..."
  if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    echo "Certificato SSL Let's Encrypt emesso e attivato con successo!"
    break
  fi
  echo "Uno dei 4 nameserver secondari di Aruba (dns2.technorail.com) sta ultimando l'aggiornamento... riprovo tra 20 secondi."
  sleep 20
done

if [ -f "$APP_DIR/.env.local" ]; then
  sed -i "s|http://$DOMAIN|https://$DOMAIN|g" "$APP_DIR/.env.local"
fi

cd "$APP_DIR"
export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=3072"
pnpm build
pm2 restart ristoreel-web
systemctl reload nginx

echo ""
echo "=================================================================="
echo "  TUTTO COMPLETO! IL SITO E' ONLINE CON HTTPS:"
echo "  -> https://$DOMAIN"
echo "  -> https://www.$DOMAIN"
echo "=================================================================="
