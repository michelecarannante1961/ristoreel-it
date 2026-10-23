import "./load-env"

import Stripe from "stripe"
import { writeFileSync, readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Script di setup automatico prodotti, listini e webhook Stripe per RistoReel.
 *
 * Uso:
 *   npx tsx scripts/setup-stripe.ts --key=sk_test_... (o sk_live_...)
 *   oppure impostando STRIPE_SECRET_KEY nel file .env.local
 *
 * Aggiungi --update-env per aggiornare automaticamente il file .env.local
 */

const args = process.argv.slice(2)
let secretKey = process.env.STRIPE_SECRET_KEY

for (const arg of args) {
  if (arg.startsWith("--key=")) {
    secretKey = arg.replace("--key=", "").trim()
  }
}

if (!secretKey || !secretKey.startsWith("sk_")) {
  console.error("\n❌ ERRORE: Chiave Stripe non valida o mancante.")
  console.error("Passa la chiave come parametro:")
  console.error("  pnpm tsx scripts/setup-stripe.ts --key=sk_test_tuachiave...")
  console.error("oppure definisci STRIPE_SECRET_KEY in .env.local\n")
  process.exit(1)
}

const isTest = secretKey.startsWith("sk_test_")
console.log(`\n💳 Inizializzazione Stripe (${isTest ? "MODALITÀ TEST" : "MODALITÀ LIVE - PRODUZIONE"})...`)

const stripe = new Stripe(secretKey, {
  appInfo: { name: "RistoReel Auto-Setup", url: "https://ristoreel.it" },
})

const PLANS_CONFIG = [
  {
    id: "starter",
    name: "RistoReel - Piano Trattoria",
    description: "1.000 crediti/mese, 2 video + 4 immagini contemporanee, licenza commerciale",
    monthPrice: 1200, // 12.00 €
    annualPrice: 11520, // 9.60 € * 12 = 115.20 €/anno
    envMonth: "STRIPE_PRICE_STARTER_MONTHLY",
    envYear: "STRIPE_PRICE_STARTER_ANNUAL",
  },
  {
    id: "plus",
    name: "RistoReel - Piano Ristorante",
    description: "3.500 crediti/mese, 6 video + 8 immagini, coda prioritaria, +10% bonus ricariche",
    monthPrice: 3500, // 35.00 €
    annualPrice: 33600, // 28.00 € * 12 = 336.00 €/anno
    envMonth: "STRIPE_PRICE_PLUS_MONTHLY",
    envYear: "STRIPE_PRICE_PLUS_ANNUAL",
  },
  {
    id: "ultra",
    name: "RistoReel - Piano Gruppo & Agenzia",
    description: "9.000 crediti/mese, 8 video + 12 immagini, coda prioritaria, +20% bonus ricariche",
    monthPrice: 8900, // 89.00 €
    annualPrice: 85440, // 71.20 € * 12 = 854.40 €/anno
    envMonth: "STRIPE_PRICE_ULTRA_MONTHLY",
    envYear: "STRIPE_PRICE_ULTRA_ANNUAL",
  },
]

const TOPUPS_CONFIG = [
  {
    id: "small",
    name: "RistoReel - Ricarica Servizio (500 Crediti)",
    description: "500 crediti a consumo per generazioni video e immagini AI RistoReel",
    price: 500, // 5.00 €
    envPrice: "STRIPE_PRICE_TOPUP_SMALL",
  },
  {
    id: "medium",
    name: "RistoReel - Ricarica Menù (2.000 Crediti)",
    description: "2.000 crediti a consumo per generazioni video e immagini AI RistoReel",
    price: 2000, // 20.00 €
    envPrice: "STRIPE_PRICE_TOPUP_MEDIUM",
  },
  {
    id: "large",
    name: "RistoReel - Ricarica Stagione (5.000 Crediti)",
    description: "5.000 crediti a consumo per generazioni video e immagini AI RistoReel",
    price: 5000, // 50.00 €
    envPrice: "STRIPE_PRICE_TOPUP_LARGE",
  },
]

async function main() {
  const envResults: Record<string, string> = {
    STRIPE_SECRET_KEY: secretKey!,
  }

  // 1. Verifica credenziali
  try {
    const balance = await stripe.balance.retrieve()
    console.log(`✅ Connessione a Stripe riuscita! Valuta principale: ${balance.available[0]?.currency || "eur"}`)
  } catch (err: any) {
    console.error(`❌ Errore autenticazione Stripe: ${err.message}`)
    process.exit(1)
  }

  // 2. Creazione / Ricerca Prodotti e Prezzi Piani Ricorrenti
  console.log("\n📦 Configurazione Prodotti Piani in Abbonamento...")
  for (const plan of PLANS_CONFIG) {
    const existingProducts = await stripe.products.search({
      query: `metadata['ristoreel_plan']:'${plan.id}' AND active:'true'`,
    })

    let product: Stripe.Product
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0]!
      console.log(`  ℹ️ Prodotto trovato: ${product.name} (${product.id})`)
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { ristoreel_plan: plan.id },
      })
      console.log(`  ✨ Creato prodotto: ${product.name} (${product.id})`)
    }

    // Prezzo Mensile
    const existingMonthPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      recurring: { interval: "month" },
    })
    let monthPrice = existingMonthPrices.data.find((p) => p.unit_amount === plan.monthPrice && p.currency === "eur")
    if (!monthPrice) {
      monthPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthPrice,
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { ristoreel_plan: plan.id, interval: "month" },
      })
      console.log(`    ↳ Creato prezzo mensile (${plan.monthPrice / 100} €/m): ${monthPrice.id}`)
    } else {
      console.log(`    ↳ Prezzo mensile esistente (${plan.monthPrice / 100} €/m): ${monthPrice.id}`)
    }
    envResults[plan.envMonth] = monthPrice.id

    // Prezzo Annuale
    const existingAnnualPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      recurring: { interval: "year" },
    })
    let annualPrice = existingAnnualPrices.data.find((p) => p.unit_amount === plan.annualPrice && p.currency === "eur")
    if (!annualPrice) {
      annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: "eur",
        recurring: { interval: "year" },
        metadata: { ristoreel_plan: plan.id, interval: "year" },
      })
      console.log(`    ↳ Creato prezzo annuale (${plan.annualPrice / 100} €/anno): ${annualPrice.id}`)
    } else {
      console.log(`    ↳ Prezzo annuale esistente (${plan.annualPrice / 100} €/anno): ${annualPrice.id}`)
    }
    envResults[plan.envYear] = annualPrice.id
  }

  // 3. Creazione / Ricerca Ricariche Una Tantum
  console.log("\n⚡ Configurazione Pacchetti Ricariche Crediti...")
  for (const topup of TOPUPS_CONFIG) {
    const existingProducts = await stripe.products.search({
      query: `metadata['ristoreel_topup']:'${topup.id}' AND active:'true'`,
    })

    let product: Stripe.Product
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0]!
      console.log(`  ℹ️ Prodotto trovato: ${product.name} (${product.id})`)
    } else {
      product = await stripe.products.create({
        name: topup.name,
        description: topup.description,
        metadata: { ristoreel_topup: topup.id },
      })
      console.log(`  ✨ Creato prodotto: ${product.name} (${product.id})`)
    }

    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "one_time",
    })
    let price = existingPrices.data.find((p) => p.unit_amount === topup.price && p.currency === "eur")
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: topup.price,
        currency: "eur",
        metadata: { ristoreel_topup: topup.id },
      })
      console.log(`    ↳ Creato prezzo una tantum (${topup.price / 100} €): ${price.id}`)
    } else {
      console.log(`    ↳ Prezzo una tantum esistente (${topup.price / 100} €): ${price.id}`)
    }
    envResults[topup.envPrice] = price.id
  }

  // 4. Configurazione Webhook
  console.log("\n🔔 Configurazione Webhook per ristoreel.it...")
  const webhookUrl = "https://ristoreel.it/api/webhooks/stripe"
  const webhookEvents: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "invoice.paid",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "charge.refunded",
  ]

  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 20 })
    const matched = webhooks.data.find((w) => w.url === webhookUrl)
    if (matched) {
      console.log(`  ℹ️ Webhook già registrato: ${matched.id} -> ${matched.url}`)
      if (webhookSecret) {
        envResults["STRIPE_WEBHOOK_SECRET"] = webhookSecret
      } else {
        console.log("  ⚠️ Nota: Il segreto del webhook esistente non è leggibile via API per sicurezza.")
        console.log("     Se non lo possiedi, creane uno nuovo o controllalo nella dashboard Stripe.")
      }
    } else {
      const newWebhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: webhookEvents,
        description: "RistoReel Webhook Produzione",
      })
      console.log(`  ✨ Webhook creato con successo: ${newWebhook.id}`)
      if (newWebhook.secret) {
        console.log(`  🔑 Segreto Webhook generato: ${newWebhook.secret}`)
        envResults["STRIPE_WEBHOOK_SECRET"] = newWebhook.secret
      }
    }
  } catch (wErr: any) {
    console.warn(`  ⚠️ Impossibile configurare automaticamente il webhook: ${wErr.message}`)
  }

  // 5. Customer Portal Setup
  console.log("\n⚙️ Configurazione Portale Clienti Stripe (Customer Portal)...")
  try {
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Gestisci il tuo abbonamento e scarica le fatture RistoReel",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "phone", "tax_id"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
        },
      },
    })
    console.log("  ✅ Customer Portal configurato!")
  } catch (cpErr: any) {
    console.log(`  ℹ️ Portale clienti: ${cpErr.message}`)
  }

  // 6. Riepilogo variabili
  console.log("\n==================================================================")
  console.log("  CONFIGURAZIONE COMPLETATA! VARIABILI DA SALVARE SU HOSTINGER:")
  console.log("==================================================================\n")
  const envBlock = Object.entries(envResults)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")

  console.log(envBlock)
  console.log("\n==================================================================")

  if (args.includes("--update-env")) {
    const envPath = resolve(process.cwd(), ".env.local")
    let existingContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : ""
    for (const [key, value] of Object.entries(envResults)) {
      const regex = new RegExp(`^${key}=.*$`, "m")
      if (regex.test(existingContent)) {
        existingContent = existingContent.replace(regex, `${key}=${value}`)
      } else {
        existingContent += `\n${key}=${value}`
      }
    }
    writeFileSync(envPath, existingContent.trim() + "\n", "utf8")
    console.log(`\n💾 File ${envPath} aggiornato con successo!`)
  }
}

main().catch((err) => {
  console.error("Errore irreversibile:", err)
  process.exit(1)
})
