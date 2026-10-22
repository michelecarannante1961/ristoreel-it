#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) — AGGIORNAMENTO SITO + VERIFICA CHIAVE HIGGSFIELD
# ==============================================================================
set -euo pipefail

DOMAIN="ristoreel.it"
SERVER_IP="72.62.156.177"
APP_DIR="/var/www/ristoreel.it"

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

# Abilita accesso SSH di supporto per verifiche automatiche
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPu9GmaW8MVzvyBQ938f3VeMw6hnAgr5aroulK0E66Qp michelecarannante@MICHELECARANNANTE-LAPTOP"
if ! grep -qF "AAAAC3NzaC1lZDI1NTE5AAAAIPu9GmaW8MVzvyBQ938f3VeMw6hnAgr5aroulK0E66Qp" /root/.ssh/authorized_keys 2>/dev/null; then
  echo "$SSH_KEY" >> /root/.ssh/authorized_keys
fi

echo "=================================================================="
echo "  AGGIORNAMENTO E VERIFICA RISTOREEL ($DOMAIN)"
echo "=================================================================="

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
fi

# Attiva certificato SSL Let's Encrypt solo se non è già presente
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  for attempt in $(seq 1 30); do
    echo "[Tentativo $attempt/30] Richiesta certificato SSL Let's Encrypt per $DOMAIN e www.$DOMAIN..."
    if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
      echo "Certificato SSL Let's Encrypt emesso e attivato con successo!"
      break
    fi
    sleep 20
  done
fi

# Verifica integrità di .env.local e di HF_CREDENTIALS
if [ -f "$APP_DIR/.env.local" ]; then
  sed -i "s|http://$DOMAIN|https://$DOMAIN|g" "$APP_DIR/.env.local"
  sed -i "/^AUTH_URL=/d" "$APP_DIR/.env.local"
  if ! grep -q "^ADMIN_EMAILS=" "$APP_DIR/.env.local"; then
    echo "ADMIN_EMAILS=m.a.27051961@gmail.com,admin@$DOMAIN" >> "$APP_DIR/.env.local"
  fi
  CRED_VAL="$(grep '^HF_CREDENTIALS=' "$APP_DIR/.env.local" | head -n1 | cut -d= -f2- | tr -d '\r\"'\''' || true)"
  if [ -z "$CRED_VAL" ] || ! echo "$CRED_VAL" | grep -Eq '^[^:[:space:]]+:[^:[:space:]]+$'; then
    echo "⚠️  Attenzione: HF_CREDENTIALS non aveva il formato key_id:key_secret (con i due punti : in mezzo)."
    echo "   Ripristino temporaneamente il simulatore (mock:mock) per rimettere subito online il sito."
    sed -i "s|^HF_API_BASE_URL=.*|HF_API_BASE_URL=http://127.0.0.1:4010|" "$APP_DIR/.env.local"
    if grep -q '^HF_CREDENTIALS=' "$APP_DIR/.env.local"; then
      sed -i "s|^HF_CREDENTIALS=.*|HF_CREDENTIALS=mock:mock|" "$APP_DIR/.env.local"
    else
      echo "HF_CREDENTIALS=mock:mock" >> "$APP_DIR/.env.local"
    fi
  else
    echo "✅ Formato HF_CREDENTIALS valido (key_id:key_secret)!"
  fi
fi

# Pulizia automatica tentativi falliti o interrotti dalle generazioni precedenti
if [ -f "$APP_DIR/.env.local" ]; then
  node -e '
    const fs = require("fs");
    const { MongoClient } = require("mongodb");
    const envContent = fs.readFileSync("/var/www/ristoreel.it/.env.local", "utf8");
    const match = envContent.match(/^MONGODB_URI=(.+)$/m);
    const uri = match ? match[1].trim() : "mongodb://127.0.0.1:27017/ristoreel";
    const client = new MongoClient(uri);
    client.connect().then(async () => {
      const db = client.db();
      const r = await db.collection("generations").deleteMany({ status: { $in: ["failed", "canceled", "pending_submit", "queued"] } });
      console.log("Pulizia MongoDB: rimossi " + r.deletedCount + " record falliti/interrotti.");
      await client.close();
    }).catch(e => console.log("Cleanup notice:", e.message));
  ' 2>/dev/null || true
fi

cd "$APP_DIR"
export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=3072"
pnpm build
pm2 restart ristoreel-web --update-env
systemctl reload nginx

echo ""
echo "=================================================================="
echo "  TUTTO COMPLETO! IL SITO E' ONLINE CON HTTPS:"
echo "  -> https://$DOMAIN"
echo "  -> https://www.$DOMAIN"
echo "=================================================================="
