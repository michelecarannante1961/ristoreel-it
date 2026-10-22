/** Public brand constants, safe for client and server. */
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "RistoReel",
  domain: "ristoreel.it",
  tagline: "Il tuo ristorante. La tua prossima storia.",
  description:
    "RistoReel (ristoreel.it) — Lo studio video AI dedicato alla ristorazione: 20 ambiti, copioni 3 scene gratuiti e produzione video per il tuo locale.",
  productionUrl: process.env.APP_URL || "https://ristoreel.it",
  supportEmail: process.env.SUPPORT_EMAIL || "support@ristoreel.it",
  /** Dismissible promo bar above the nav; empty string hides it. */
  promo: process.env.NEXT_PUBLIC_PROMO_BAR ?? "",
  promoHref: process.env.NEXT_PUBLIC_PROMO_HREF ?? "/pricing",
} as const
