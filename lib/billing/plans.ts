import type { Surface } from "@/generation/catalog/types"

/**
 * RistoVideo subscription plans and credit top-up packs in EUR (€).
 * Stripe price IDs come from env.
 * Nominal credit value is CREDIT_USD_VALUE (default 0.01) with 1.5x retail markup on API cost.
 */

export type PlanId = "free" | "starter" | "plus" | "ultra"
export type BillingInterval = "month" | "year"
export type TopupId = "small" | "medium" | "large"

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  /** Credits granted each month (subscription bucket is reset to this). */
  monthlyCredits: number
  /** EUR per month when billed monthly / per month when billed annually. */
  priceMonthly: number
  priceAnnualPerMonth: number
  /** Parallel generations per surface. */
  concurrency: Record<Surface, number>
  /** Top-up credits multiplier (higher plans get bonus credits on top-ups). */
  topupMultiplier: number
  badge?: "MOST POPULAR" | "BEST VALUE"
  features: { label: string; included: boolean; tag?: string }[]
  stripePriceEnv?: { month: string; year: string }
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Degustazione",
    tagline:
      "Copioni e storyboard gratuiti + crediti di benvenuto per provare i modelli AI",
    monthlyCredits: 0,
    priceMonthly: 0,
    priceAnnualPerMonth: 0,
    concurrency: { image: 1, video: 1, audio: 1 },
    topupMultiplier: 1,
    features: [
      { label: "Generatore Copione & Storyboard 3 scene (0 crediti)", included: true },
      { label: "Tutti i 20 ambiti e 161 argomenti ristorazione", included: true },
      { label: "Brand Kit del locale e libreria personale", included: true },
      { label: "Generazioni video AI parallele", included: false },
      { label: "Licenza commerciale completa", included: false },
    ],
  },
  starter: {
    id: "starter",
    name: "Trattoria",
    tagline: "Per singoli locali che pubblicano reel e formano lo staff ogni settimana",
    monthlyCredits: 1_000,
    priceMonthly: 12,
    priceAnnualPerMonth: 9.6,
    concurrency: { image: 4, video: 2, audio: 2 },
    topupMultiplier: 1.05,
    features: [
      { label: "1.000 crediti ogni mese + Copioni illimitati gratis", included: true },
      { label: "2 video + 4 immagini AI in contemporanea", included: true },
      { label: "Brand Kit salvato (logo, stile, piatti, offerta)", included: true },
      { label: "Uso commerciale per social e sito del locale", included: true },
      { label: "+5% di crediti bonus sulle ricariche a consumo", included: true },
    ],
    stripePriceEnv: {
      month: "STRIPE_PRICE_STARTER_MONTHLY",
      year: "STRIPE_PRICE_STARTER_ANNUAL",
    },
  },
  plus: {
    id: "plus",
    name: "Ristorante",
    tagline: "Per ristoranti strutturati: promozione menù, formazione brigata e gestione",
    monthlyCredits: 3_500,
    priceMonthly: 35,
    priceAnnualPerMonth: 28,
    concurrency: { image: 8, video: 6, audio: 4 },
    topupMultiplier: 1.1,
    badge: "MOST POPULAR",
    features: [
      { label: "3.500 crediti ogni mese + Copioni illimitati gratis", included: true },
      { label: "6 video + 8 immagini AI in contemporanea", included: true },
      { label: "Uso commerciale completo e coda prioritaria", included: true },
      { label: "+10% di crediti bonus sulle ricariche a consumo", included: true, tag: "BONUS" },
      { label: "Procedure formative e briefing per cucina e sala", included: true },
    ],
    stripePriceEnv: {
      month: "STRIPE_PRICE_PLUS_MONTHLY",
      year: "STRIPE_PRICE_PLUS_ANNUAL",
    },
  },
  ultra: {
    id: "ultra",
    name: "Gruppo & Agenzia",
    tagline: "Per catene di ristorazione, franchising e agenzie di marketing food",
    monthlyCredits: 9_000,
    priceMonthly: 89,
    priceAnnualPerMonth: 71.2,
    concurrency: { image: 12, video: 8, audio: 6 },
    topupMultiplier: 1.2,
    badge: "BEST VALUE",
    features: [
      { label: "9.000 crediti ogni mese + Copioni illimitati gratis", included: true },
      { label: "8 video + 12 immagini AI in contemporanea", included: true },
      { label: "Uso commerciale multi-locale e coda prioritaria", included: true },
      { label: "+20% di crediti bonus sulle ricariche a consumo", included: true, tag: "BONUS" },
      { label: "Massima capacità per campagne stagionali e menù", included: true },
    ],
    stripePriceEnv: {
      month: "STRIPE_PRICE_ULTRA_MONTHLY",
      year: "STRIPE_PRICE_ULTRA_ANNUAL",
    },
  },
}

export const PAID_PLANS = [PLANS.starter, PLANS.plus, PLANS.ultra] as const

export interface TopupPack {
  id: TopupId
  name: string
  credits: number
  price: number
  stripePriceEnv: string
}

export const TOPUPS: Record<TopupId, TopupPack> = {
  small: {
    id: "small",
    name: "Ricarica Servizio",
    credits: 500,
    price: 5,
    stripePriceEnv: "STRIPE_PRICE_TOPUP_SMALL",
  },
  medium: {
    id: "medium",
    name: "Ricarica Menù",
    credits: 2_000,
    price: 20,
    stripePriceEnv: "STRIPE_PRICE_TOPUP_MEDIUM",
  },
  large: {
    id: "large",
    name: "Ricarica Stagione",
    credits: 5_000,
    price: 50,
    stripePriceEnv: "STRIPE_PRICE_TOPUP_LARGE",
  },
}

export function planOf(id: string | undefined | null): Plan {
  return id && id in PLANS ? PLANS[id as PlanId] : PLANS.free
}

/** Credits a top-up grants on a given plan (bonus for higher tiers). */
export function topupCredits(pack: TopupPack, plan: Plan): number {
  return Math.floor(pack.credits * plan.topupMultiplier)
}

export function annualSavingsPercent(plan: Plan): number {
  if (!plan.priceMonthly) return 0
  return Math.round((1 - plan.priceAnnualPerMonth / plan.priceMonthly) * 100)
}
