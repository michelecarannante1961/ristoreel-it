#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) Ã¢â‚¬â€ ATTIVAZIONE AUTOMATICA HTTPS (CERTBOT + ARUBA DNS)
# Attende che il DNS di Aruba punti a 72.62.156.177 e attiva subito HTTPS!
# ==============================================================================
set -euo pipefail

DOMAIN="ristoreel.it"
SERVER_IP="72.62.156.177"
APP_DIR="/var/www/ristoreel.it"

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

echo "=================================================================="
echo "  AGGIORNAMENTO GRAFICA HTTP + ATTIVAZIONE HTTPS ($DOMAIN)"
echo "=================================================================="

if [ -d "$APP_DIR/.git" ]; then
  echo "Aggiornamento rapido grafica per accesso HTTP su IP ($SERVER_IP:3021)..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
  export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=3072"
  pnpm build
  pm2 restart ristoreel-web
  echo "Grafica su http://$SERVER_IP:3021 sistemata! Ricarica la pagina con CTRL+F5."
fi

for attempt in $(seq 1 60); do
  CURRENT_IP="$(curl -4 -fsSL "https://dns.google/resolve?name=$DOMAIN&type=A" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | tail -n 1 || true)"
  if [ -z "$CURRENT_IP" ]; then
    CURRENT_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
  fi

  if [ "$CURRENT_IP" = "$SERVER_IP" ]; then
    echo "DNS propagato correttamente! $DOMAIN -> $SERVER_IP"
    break
  fi

  echo "[$attempt/60] DNS Aruba in aggiornamento (attuale: ${CURRENT_IP:-in attesa} -> atteso: $SERVER_IP)... riprovo tra 20 secondi."
  sleep 20
done

CURRENT_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
  echo "Il DNS Aruba sta ancora propagando. Il sito e' gia' pronto su http://$DOMAIN appena Aruba aggiorna."
  exit 0
fi

echo "Richiesta certificato SSL Let's Encrypt per $DOMAIN e www.$DOMAIN..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

if [ -f "$APP_DIR/.env.local" ]; then
  sed -i "s|http://$DOMAIN|https://$DOMAIN|g" "$APP_DIR/.env.local"
  pm2 restart ristoreel-web
fi

echo ""
echo "=================================================================="
echo "  HTTPS ATTIVO! Ora puoi aprire: https://$DOMAIN"
echo "=================================================================="
