import { z } from "zod"

import { RESTAURANT_AREAS, restaurantArea } from "./catalog"

export const PURPOSES = {
  promozione: "Promuovere il ristorante",
  formazione: "Formare il personale",
  gestione: "Spiegare e migliorare la gestione",
} as const

export const STYLES = {
  cinematografico: "Cinematografico",
  autentico: "Autentico e quotidiano",
  didattico: "Chiaro e didattico",
} as const

export const restaurantBriefSchema = z
  .object({
    areaId: z
      .string()
      .refine(
        (id) => Boolean(restaurantArea(id)),
        "Scegli un ambito della ristorazione."
      ),
    topic: z.string().max(200),
    purpose: z.enum(["promozione", "formazione", "gestione"]),
    style: z.enum(["cinematografico", "autentico", "didattico"]),
    restaurantName: z.string().trim().max(120).default(""),
    callToAction: z.string().trim().max(160).default(""),
    cuisineType: z.string().trim().max(120).optional(),
    signatureOffer: z.string().trim().max(240).optional(),
  })
  .superRefine((value, context) => {
    if (!restaurantArea(value.areaId)?.topics.includes(value.topic))
      context.addIssue({
        code: "custom",
        path: ["topic"],
        message: "Il sottoargomento non appartiene all'ambito scelto.",
      })
  })

export type RestaurantBrief = z.infer<typeof restaurantBriefSchema>

export const DEFAULT_BRIEF: RestaurantBrief = {
  areaId: RESTAURANT_AREAS[0]!.id,
  topic: RESTAURANT_AREAS[0]!.topics[0]!,
  purpose: "promozione",
  style: "cinematografico",
  restaurantName: "",
  callToAction: "",
}

/** Same deterministic compilation on browser and server, never a client-controlled system prefix. */
export function restaurantPrompt(
  raw: RestaurantBrief,
  details: string
): string {
  const brief = restaurantBriefSchema.parse(raw)
  const area = restaurantArea(brief.areaId)!
  const context = [
    "Produzione video dedicata esclusivamente alla ristorazione professionale.",
    `Ambito: ${area.title}. Sottoargomento: ${brief.topic}.`,
    `Obiettivo: ${PURPOSES[brief.purpose]}. Stile: ${STYLES[brief.style]}.`,
    brief.restaurantName ? `Locale: ${brief.restaurantName}.` : "",
    brief.cuisineType ? `Identità gastronomica: ${brief.cuisineType}.` : "",
    brief.signatureOffer ? `Offerta o piatto distintivo: ${brief.signatureOffer}.` : "",
    "Ambientazione coerente con un ristorante reale; piatti, ingredienti, cucina e sala credibili.",
    "Mantieni fedeltà ai materiali forniti. Non inventare prezzi, recensioni, riconoscimenti o risultati economici.",
    brief.purpose === "formazione"
      ? "Mostra un passaggio operativo alla volta; gesti chiari e inquadrature leggibili."
      : "",
    brief.areaId === "sicurezza-alimentare" ||
    brief.topic.toLowerCase().includes("allergen")
      ? "Per sicurezza alimentare e allergeni usa solo procedure approvate dal responsabile del locale; non inventare temperature, tempi o certificazioni."
      : "",
    "Lingua dei contenuti: italiano. Nessun testo illeggibile o marchio inventato nelle immagini.",
    brief.callToAction ? `Invito finale richiesto: ${brief.callToAction}.` : "",
    `Indicazioni creative del ristoratore: ${details.trim()}`,
  ]
  return context.filter(Boolean).join("\n")
}

const OFF_TOPIC_PATTERNS = [
  /\b(bitcoin|criptovalut\w*|ethereum|forex|trading\s+finanziario)\b/i,
  /\b(astronav\w*|battaglia\s+spaziale|guerra\s+militare|armi\s+da\s+fuoco|carro\s+armato)\b/i,
  /\b(gara\s+automobilistica|formula\s*1|motocross)\b/i,
]

export function isOffTopicRestaurantPrompt(text: string): boolean {
  const clean = text.trim()
  if (!clean) return false
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(clean))
}
