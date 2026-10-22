#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) — COLLEGAMENTO E TEST CHIAVE HIGGSFIELD API
# ==============================================================================
set -euo pipefail

APP_DIR="/var/www/ristoreel.it"
ENV_FILE="$APP_DIR/.env.local"

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

echo ""
echo "=================================================================="
echo "  COLLEGAMENTO CHIAVE REALE HIGGSFIELD SU RISTOREEL"
echo "=================================================================="
echo ""
echo "Inserisci la tua chiave API di Higgsfield."
echo "(Puoi incollare direttamente key_id:key_secret oppure solo il Key ID)"
printf "👉 Incolla qui e premi Invio: "
read -r INPUT_UNO < /dev/tty

# Pulisce eventuali spazi o virgolette o prefisso "Key "
INPUT_UNO="$(echo "$INPUT_UNO" | sed -E "s/^['\"]|['\"]$//g; s/^(Key|Bearer)[[:space:]]+//I" | tr -d '[:space:]')"

if [ -z "$INPUT_UNO" ]; then
  echo "❌ Nessun valore inserito. Operazione annullata."
  exit 1
fi

if echo "$INPUT_UNO" | grep -q ":"; then
  HF_KEY="$INPUT_UNO"
else
  printf "👉 Ora incolla il Key Secret e premi Invio: "
  read -r INPUT_DUE < /dev/tty
  INPUT_DUE="$(echo "$INPUT_DUE" | sed -E "s/^['\"]|['\"]$//g" | tr -d '[:space:]')"
  if [ -z "$INPUT_DUE" ]; then
    echo "❌ Key Secret mancante. Operazione annullata."
    exit 1
  fi
  HF_KEY="${INPUT_UNO}:${INPUT_DUE}"
fi

echo ""
echo "🔍 Verifica gratuita della chiave su https://api.higgsfield.ai ..."
HTTP_CODE="$(curl -4 -sS -o /tmp/hf_test.json -w "%{http_code}" \
  -X POST "https://api.higgsfield.ai/estimate/kling-video/v2.5-turbo/pro/text-to-video" \
  -H "Authorization: Key $HF_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"prompt":"test","duration":5}' || echo "000")"

RESPONSE_BODY="$(cat /tmp/hf_test.json 2>/dev/null || true)"
rm -f /tmp/hf_test.json

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ CHIAVE HIGGSFIELD VALIDA E ATTIVA! Risposta API: $RESPONSE_BODY"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  echo "❌ Chiave rifiutata da Higgsfield (HTTP $HTTP_CODE): $RESPONSE_BODY"
  echo "   Controlla di aver copiato correttamente sia Key ID che Key Secret da console.higgsfield.ai"
  exit 1
else
  echo "ℹ️  Risposta da Higgsfield (HTTP $HTTP_CODE): $RESPONSE_BODY"
fi

# Aggiorna .env.local sul server
sed -i "s|^HF_API_BASE_URL=.*|HF_API_BASE_URL=https://api.higgsfield.ai|" "$ENV_FILE"
if grep -q "^HF_CREDENTIALS=" "$ENV_FILE"; then
  sed -i "s|^HF_CREDENTIALS=.*|HF_CREDENTIALS=$HF_KEY|" "$ENV_FILE"
else
  echo "HF_CREDENTIALS=$HF_KEY" >> "$ENV_FILE"
fi

pm2 restart ristoreel-web --update-env

echo ""
echo "=================================================================="
echo "  🎉 MOTORE AI REALE HIGGSFIELD ATTIVO SU https://www.ristoreel.it"
echo "=================================================================="
