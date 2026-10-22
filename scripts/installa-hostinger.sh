#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) â€” INSTALLAZIONE AUTOMATICA SU HOSTINGER (72.62.156.177)
# Incolla nel terminale di Hostinger:
#   curl -fsSL https://raw.githubusercontent.com/michelecarannante1961/ristoreel-it/main/scripts/installa-hostinger.sh | sudo bash
# ==============================================================================
set -euo pipefail

DOMAIN="ristoreel.it"
SERVER_IP="72.62.156.177"
APP_DIR="/var/www/ristoreel.it"
REPO_URL="https://github.com/michelecarannante1961/ristoreel-it.git"
APP_PORT=3021
MOCK_PORT=4010
MONGO_PORT=27027

echo ""
echo "=================================================================="
echo "  INSTALLAZIONE AUTOMATICA RISTOREEL ($DOMAIN -> $SERVER_IP)"
echo "=================================================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Eseguo con privilegi root (sudo)..."
  exec sudo bash "$0" "$@"
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/7] Verifica pacchetti di sistema (curl, git, nginx, certbot, build-essential)..."
apt-get update -y
apt-get install -y curl git ca-certificates gnupg nginx certbot python3-certbot-nginx lsof ufw

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow "$APP_PORT/tcp" >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

echo "[2/7] Verifica Node.js 22 LTS + pnpm..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack enable
corepack prepare pnpm@latest --activate

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "[3/7] Scaricamento codice RistoReel in $APP_DIR..."
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
mkdir -p .data/mongo .data/media .data/logs

echo "[4/7] Installazione dipendenze Node.js..."
pnpm install --frozen-lockfile

echo "[5/7] Configurazione ambiente (.env.local) per $DOMAIN..."
RESOLVED_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
  ORIGIN_URL="https://$DOMAIN"
else
  ORIGIN_URL="http://$DOMAIN"
fi

if [ ! -f "$APP_DIR/.env.local" ]; then
  AUTH_SEC="$(openssl rand -hex 32)"
  WEBHOOK_SEC="$(openssl rand -hex 32)"
  CRON_SEC="$(openssl rand -hex 32)"
  cat > "$APP_DIR/.env.local" <<EOF
# Configurazione generata automaticamente per RistoReel ($DOMAIN)
APP_URL=$ORIGIN_URL
AUTH_URL=$ORIGIN_URL
NEXT_PUBLIC_BRAND_NAME=RistoReel
AUTH_SECRET=$AUTH_SEC
EMAIL_FROM="RistoReel <login@$DOMAIN>"
SUPPORT_EMAIL=support@$DOMAIN
MONGODB_URI=mongodb://127.0.0.1:$MONGO_PORT/?replicaSet=vireo
MONGODB_DB=ristoreel-prod
HF_API_BASE_URL=http://127.0.0.1:$MOCK_PORT
HF_CREDENTIALS=mock:mock
HF_WEBHOOK_SECRET=$WEBHOOK_SEC
HF_WEBHOOK_BASE_URL=$ORIGIN_URL
HF_PRICE_GUARD=true
RESTAURANT_MODE=true
CREDIT_MARKUP=1.5
CREDIT_USD_VALUE=0.01
SIGNUP_BONUS_CREDITS=500
E2E_TEST_MODE=true
BLOCK_DISPOSABLE_EMAIL=false
NEXT_PUBLIC_DEMO_MODE=true
CRON_SECRET=$CRON_SEC
EOF
fi

echo "[6/7] Compilazione di produzione Next.js (pnpm build)..."
pnpm build

echo "[7/7] Avvio servizi con PM2 (Database MongoDB Replica Set + Simulatore + RistoReel)..."
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [
    {
      name: "ristoreel-mongo",
      cwd: "$APP_DIR",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "scripts/dev-mongo.ts",
      env: {
        NODE_ENV: "development"
      },
      autorestart: true,
      max_restarts: 20
    },
    {
      name: "ristoreel-mock-hf",
      cwd: "$APP_DIR",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "scripts/mock-higgsfield.ts",
      env: {
        NODE_ENV: "development",
        MOCK_HF_PORT: "$MOCK_PORT"
      },
      autorestart: true,
      max_restarts: 20
    },
    {
      name: "ristoreel-web",
      cwd: "$APP_DIR",
      script: "server.mjs",
      env: {
        NODE_ENV: "development",
        PORT: "$APP_PORT",
        HOSTNAME: "0.0.0.0"
      },
      autorestart: true,
      max_restarts: 20
    }
  ]
}
EOF

pm2 delete ristoreel-mongo ristoreel-mock-hf ristoreel-web >/dev/null 2>&1 || true
pm2 start "$APP_DIR/ecosystem.config.cjs"

echo "Attesa avvio database locale MongoDB su porta $MONGO_PORT (il primo scaricamento richiede ~20-40s)..."
for i in $(seq 1 90); do
  if (echo > /dev/tcp/127.0.0.1/$MONGO_PORT) >/dev/null 2>&1; then
    echo "Database MongoDB pronto!"
    break
  fi
  sleep 2
done

echo "Inizializzazione indici e catalogo RistoReel..."
pnpm db:init --admin=admin@$DOMAIN || true

pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "Configurazione Nginx per $DOMAIN e www.$DOMAIN..."
cat > "/etc/nginx/sites-available/$DOMAIN" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
systemctl reload nginx

echo "Verifica certificato HTTPS Let's Encrypt per $DOMAIN..."
if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
  echo "Il DNS di $DOMAIN punta a $SERVER_IP: attivo subito il certificato SSL HTTPS..."
  if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    sed -i "s|http://$DOMAIN|https://$DOMAIN|g" "$APP_DIR/.env.local"
    pm2 restart ristoreel-web
  fi
else
  echo "NOTA DNS: $DOMAIN non risolve ancora su $SERVER_IP (attuale: '${RESOLVED_IP:-non propagato}')."
  echo "Appena avrai impostato il record A di $DOMAIN su $SERVER_IP, rilancia questo stesso comando oppure:"
  echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect"
fi

echo ""
echo "=================================================================="
echo "  INSTALLAZIONE RISTOREEL COMPLETATA CON SUCCESSO!"
echo "  - Dominio principale (quando il DNS e' attivo): http://$DOMAIN"
echo "  - Accesso diretto immediato tramite IP:         http://$SERVER_IP:$APP_PORT"
echo "  - Cartella applicazione sul server:             $APP_DIR"
echo "  - Stato dei servizi in background:              pm2 status"
echo "=================================================================="
