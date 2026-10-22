#!/usr/bin/env bash
# ==============================================================================
# RISTOREEL (ristoreel.it) â€” INSTALLAZIONE AUTOMATICA SU HOSTINGER (72.62.156.177)
# Fix IPv4 per registry.npmjs.org + abilitazione chiave SSH + avvio automatico
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
  exec sudo bash "$0" "$@"
fi

export DEBIAN_FRONTEND=noninteractive

# 0. Abilita accesso SSH diretto dal PC di sviluppo (cosi' posso aiutarti direttamente)
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPu9GmaW8MVzvyBQ938f3VeMw6hnAgr5aroulK0E66Qp michelecarannante@MICHELECARANNANTE-LAPTOP"
if ! grep -qF "AAAAC3NzaC1lZDI1NTE5AAAAIPu9GmaW8MVzvyBQ938f3VeMw6hnAgr5aroulK0E66Qp" /root/.ssh/authorized_keys 2>/dev/null; then
  echo "$SSH_KEY" >> /root/.ssh/authorized_keys
fi

# 1. FORZA IPv4 SU UBUNTU / NODE / NPM (Evita il blocco "timed out after 30s" su Hostinger!)
echo "[1/7] Ottimizzazione rete IPv4 per evitare blocchi su registry.npmjs.org..."
if ! grep -q "^precedence ::ffff:0:0/96  100" /etc/gai.conf 2>/dev/null; then
  echo "precedence ::ffff:0:0/96  100" >> /etc/gai.conf
fi
export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=3072"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "[2/7] Verifica pacchetti di sistema (curl, git, nginx, certbot)..."
apt-get update -y
apt-get install -y curl git ca-certificates gnupg nginx certbot python3-certbot-nginx lsof ufw

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow "$APP_PORT/tcp" >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

echo "[3/7] Configurazione Node.js + pnpm + PM2 (su IPv4)..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
  curl -4 -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

npm config set prefer-online true || true
npm config set fetch-retries 5 || true
npm config set fetch-retry-mintimeout 10000 || true

corepack disable >/dev/null 2>&1 || true
if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@10 pm2
else
  command -v pm2 >/dev/null 2>&1 || npm install -g pm2
fi

echo "[4/7] Scaricamento codice RistoReel in $APP_DIR..."
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

echo "[5/7] Installazione dipendenze del progetto con pnpm (IPv4)..."
pnpm config set network-concurrency 8 || true
pnpm install --no-frozen-lockfile

echo "[6/7] Configurazione ambiente (.env.local) e compilazione (pnpm build)..."
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

pnpm build

echo "[7/7] Avvio servizi con PM2 e configurazione Nginx..."
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [
    {
      name: "ristoreel-mongo",
      cwd: "$APP_DIR",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "scripts/dev-mongo.ts",
      env: {
        NODE_ENV: "development",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
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
        MOCK_HF_PORT: "$MOCK_PORT",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
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
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
      },
      autorestart: true,
      max_restarts: 20
    }
  ]
}
EOF

pm2 delete ristoreel-mongo ristoreel-mock-hf ristoreel-web >/dev/null 2>&1 || true
pm2 start "$APP_DIR/ecosystem.config.cjs"

echo "Attesa avvio database locale MongoDB su porta $MONGO_PORT..."
for i in $(seq 1 90); do
  if (echo > /dev/tcp/127.0.0.1/$MONGO_PORT) >/dev/null 2>&1; then
    echo "Database MongoDB pronto!"
    break
  fi
  sleep 2
done

pnpm db:init --admin=admin@$DOMAIN || true
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

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

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
  if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    sed -i "s|http://$DOMAIN|https://$DOMAIN|g" "$APP_DIR/.env.local"
    pm2 restart ristoreel-web
  fi
fi

echo ""
echo "=================================================================="
echo "  INSTALLAZIONE RISTOREEL COMPLETATA CON SUCCESSO!"
echo "  - Apri subito da browser: http://$SERVER_IP:$APP_PORT"
echo "  - Dominio principale:     http://$DOMAIN"
echo "=================================================================="
