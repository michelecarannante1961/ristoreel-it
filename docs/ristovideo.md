# RistoReel (ristoreel.it) — Guida Messa Online su Hostinger (hPanel)

Percorso progetto locale: `D:\TEST\2026-10-21\RistoVideo-Studio\sorgente`  
Dominio ufficiale: **https://ristoreel.it**  
Brand: **RistoReel**

---

## 1. Architettura per Hostinger Web / Cloud Hosting (hPanel Node.js)

Su **Hostinger Web Hosting / Cloud Hosting**, il pannello **hPanel** gestisce le applicazioni Node.js tramite **Phusion Passenger / LiteSpeed**. Per garantire la piena compatibilità senza dipendere da Vercel:

1. **Entry point dedicato (`server.mjs`)**: avvia automaticamente il server di produzione Next.js sulla porta dinamica (`process.env.PORT`) assegnata da Hostinger.
2. **Riconciliazione automatica In-Process (`instrumentation.ts`)**: poiché su Hostinger l'app Node.js rimane attiva come processo persistente, il reconciler delle generazioni video, dei rimborsi automatici e dei rinnovi annuali gira automaticamente **ogni 60 secondi** all'interno del server Node.js, oltre a esporre l'endpoint `/api/cron/reconcile` richiamabile dai Cron Job di hPanel.
3. **SEO e Indicizzazione per `ristoreel.it`**: sono preconfigurati `robots.ts` (`https://ristoreel.it/robots.txt`) e `sitemap.ts` (`https://ristoreel.it/sitemap.xml`).

---

## 2. Configurazione dell'Applicazione Node.js su Hostinger hPanel

1. Accedi a **hPanel di Hostinger** → seleziona il sito **ristoreel.it**.
2. Nel menu laterale vai su **Avanzate** → **Node.js** (oppure **Siti Web** → **Impostazioni Node.js**).
3. Imposta i seguenti parametri:
   - **Versione Node.js**: `20.x` o `22.x` (consigliato Node 20 LTS o 22 LTS)
   - **Modalità applicazione**: `Production`
   - **Root dell'applicazione (Application root)**: la cartella che contiene il contenuto di `sorgente` (es. `domains/ristoreel.it/public_html`)
   - **File di avvio dell'applicazione (Application startup file)**: `server.mjs`
4. Carica il codice (tramite **Git Deployment** collegando il tuo repository GitHub/GitLab oppure via SSH/SFTP):
   - Se usi SSH su Hostinger:
     ```bash
     cd ~/domains/ristoreel.it/public_html
     corepack enable
     pnpm install --frozen-lockfile
     pnpm build
     ```
5. Copia tutte le variabili presenti in `.env.hostinger.example` nel file `.env` nella root dell'applicazione su Hostinger (o nella sezione *Environment Variables* del pannello Node.js) e clicca **Restart** sull'app Node.js.

---

## 3. Configurazione DNS su Hostinger (`ristoreel.it`)

Nella sezione **Domini** → **ristoreel.it** → **DNS / Nameserver** di Hostinger, verifica che siano presenti:

| Tipo | Nome | Destinazione / Valore | Scopo |
|---|---|---|---|
| `A` | `@` | IP del tuo piano Hostinger (già preimpostato da hPanel) | Sito principale `ristoreel.it` |
| `CNAME` | `www` | `ristoreel.it` | Reindirizzamento `www.ristoreel.it` |
| `CNAME` | `media` | URL/dominio custom del bucket Cloudflare R2 | CDN video generati (`https://media.ristoreel.it`) |
| `TXT` / `DKIM` | `resend._domainkey` (e SPF) | Valori forniti da Resend | Invio Magic Link da `login@ristoreel.it` |

Attiva inoltre **SSL/HTTPS gratuito (Let's Encrypt)** da hPanel → **Sicurezza** → **SSL** e abilita **Forza HTTPS**.

---

## 4. Cron Job di Backup su Hostinger hPanel (Opzionale ma Consigliato)

Anche se `instrumentation.ts` esegue già la riconciliazione ogni 60 secondi quando il processo Node è attivo, puoi aggiungere un Cron Job in **hPanel → Avanzate → Cron Jobs** (frequenza: *Ogni 5 minuti*) per garantire che il server resti sempre sveglio e allineato:

```bash
curl -fsS -X POST https://ristoreel.it/api/cron/reconcile -H "Authorization: Bearer IL_TUO_CRON_SECRET" >/dev/null 2>&1
```

---

## 5. Servizi Esterni da Collegare a `ristoreel.it`

1. **Database MongoDB Atlas (Replica Set)**:
   - Crea un cluster su MongoDB Atlas (anche piano gratuito M0), abilita l'accesso dall'IP del server Hostinger (o `0.0.0.0/0` con password forte) e imposta:
     - `MONGODB_URI=mongodb+srv://...`
     - `MONGODB_DB=ristoreel-prod`
   - Esegui una volta `pnpm db:init --admin=tuaemail@ristoreel.it` per creare indici e ruolo amministratore.
2. **API Higgsfield**:
   - Da `https://console.higgsfield.ai` ottieni `key_id:key_secret` e imposta:
     - `HF_API_BASE_URL=https://api.higgsfield.ai`
     - `HF_CREDENTIALS=key_id:key_secret`
     - `HF_WEBHOOK_SECRET=<64 caratteri hex>`
     - `HF_WEBHOOK_BASE_URL=https://ristoreel.it`
     - `HF_PRICE_GUARD=true`
3. **Stripe in Euro (€)**:
   - Crea i 3 piani ricorrenti in **EUR** (Trattoria 12 €/9,60 €, Ristorante 35 €/28 €, Gruppo & Agenzia 89 €/71,20 €) e le 3 ricariche one-time in **EUR** (5 €, 20 €, 50 €).
   - Imposta il webhook Stripe su `https://ristoreel.it/api/webhooks/stripe` con gli eventi:
     `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.
4. **Cloudflare R2 & Resend**:
   - Collega il bucket R2 alle variabili `R2_*` (es. `R2_PUBLIC_BASE_URL=https://media.ristoreel.it`) e imposta la regola CORS di R2 consentendo `GET`, `PUT`, `HEAD` da `https://ristoreel.it`.
   - Verifica il dominio `ristoreel.it` su Resend per spedire da `RistoReel <login@ristoreel.it>`.
