import {
  PURPOSES,
  STYLES,
  restaurantBriefSchema,
  type RestaurantBrief,
} from "./brief"
import { restaurantArea } from "./catalog"

export interface StoryboardScene {
  number: 1 | 2 | 3
  title: string
  durationSec: string
  camera: string
  visualAction: string
  voiceover: string
  onScreenText: string
  aiPrompt: string
}

export interface RestaurantStoryboard {
  projectTitle: string
  recommendedFormat: string
  recommendedAspectRatio: "9:16" | "16:9"
  complianceNote?: string
  scenes: [StoryboardScene, StoryboardScene, StoryboardScene]
  combinedAiPrompt: string
}

const STYLE_CAMERA: Record<
  keyof typeof STYLES,
  { hook: string; body: string; close: string }
> = {
  cinematografico: {
    hook: "Macro ravvicinata in lento movimento in avanti, luce calda laterale e profondità di campo ridotta",
    body: "Piano medio fluido a 45 gradi sulle mani al lavoro, contrasto morbido tra ombre antracite e riflessi ambrati",
    close: "Inquadratura finale frontale stabile con impiattamento o sala illuminata, stacco elegante sul dettaglio",
  },
  autentico: {
    hook: "Camera a mano naturale ad altezza sguardo, ingresso diretto nel ritmo reale del servizio",
    body: "Sequenza ravvicinata spontanea dei gesti in cucina o in sala, luce naturale dell'ambiente",
    close: "Sguardo accogliente verso l'ospite o presentazione genuina del piatto sul pass",
  },
  didattico: {
    hook: "Inquadratura zenitale o frontale nitida della postazione ordinata con tutti gli strumenti visibili",
    body: "Primo piano stabile e ben illuminato sul singolo passaggio operativo, gesti lenti e leggibili",
    close: "Panoramica finale di verifica dello standard completato, pulita e priva di distrazioni",
  },
}

/**
 * Generates a free, deterministic 3-scene script and storyboard tailored to the
 * restaurant brief and creative notes (Hybrid Model: 0 credits to plan, credits only to render AI video).
 */
export function buildRestaurantStoryboard(
  rawBrief: RestaurantBrief,
  rawDetails = ""
): RestaurantStoryboard {
  const brief = restaurantBriefSchema.parse(rawBrief)
  const area = restaurantArea(brief.areaId)!
  const details = rawDetails.trim()
  const locale = brief.restaurantName || "il nostro ristorante"
  const cuisine = brief.cuisineType ? ` (${brief.cuisineType})` : ""
  const offer = brief.signatureOffer
    ? ` Valorizza la specialità: ${brief.signatureOffer}.`
    : ""
  const cta =
    brief.callToAction ||
    (brief.purpose === "promozione"
      ? "Prenota il tuo tavolo"
      : brief.purpose === "formazione"
        ? "Applica questa procedura a ogni servizio"
        : "Condividi questo standard con il team")

  const camera = STYLE_CAMERA[brief.style]
  const isSafety =
    brief.areaId === "sicurezza-alimentare" ||
    brief.topic.toLowerCase().includes("allergen") ||
    brief.topic.toLowerCase().includes("haccp")

  const recommendedAspectRatio =
    brief.purpose === "promozione" ? "9:16" : "16:9"
  const recommendedFormat =
    brief.purpose === "promozione"
      ? "Reel / TikTok / YouTube Shorts verticale (9:16 · 9–12s)"
      : brief.purpose === "formazione"
        ? "Pillola formativa per brigata e sala (16:9 · 10–15s)"
        : "Briefing operativo per il ristoratore (16:9 · 10–15s)"

  const subjectLine = details || `${brief.topic} presso ${locale}${cuisine}`

  const scene1Action =
    brief.purpose === "promozione"
      ? `Apertura d'impatto su "${brief.topic}" da ${locale}${cuisine}.${offer} Mostra subito l'ingrediente o l'atmosfera reale del locale.`
      : brief.purpose === "formazione"
        ? `Preparazione della postazione per "${brief.topic}" in ${locale}. Strumenti, linea e ordine operativo prima di iniziare.`
        : `Contesto gestionale di "${area.title} — ${brief.topic}" all'interno di ${locale}. Focus visivo su organizzazione e controllo.`

  const scene2Action =
    brief.purpose === "promozione"
      ? `Il momento centrale: ${subjectLine}. Gesti precisi dello chef o del personale di sala, texture autentiche e cura artigianale.`
      : brief.purpose === "formazione"
        ? `Esecuzione passo-passo: ${subjectLine}. Mostra un solo gesto tecnico alla volta in modo chiaro e replicabile dallo staff.`
        : `Applicazione pratica sul campo: ${subjectLine}. Evidenzia come il metodo migliora tempi, margini o qualità del servizio.`

  const scene3Action =
    brief.purpose === "promozione"
      ? `Risultato finale servito al tavolo in ${locale}, atmosfera accogliente e invito diretto agli ospiti: "${cta}".`
      : brief.purpose === "formazione"
        ? `Controllo finale di conformità per "${brief.topic}": verifica visiva dello standard richiesto prima del servizio.`
        : `Risultato operativo consolidato per ${locale}: flusso ordinato, squadra allineata e obiettivo raggiunto.`

  const scenes: [StoryboardScene, StoryboardScene, StoryboardScene] = [
    {
      number: 1,
      title:
        brief.purpose === "promozione"
          ? "Apertura e richiamo visivo (Hook)"
          : brief.purpose === "formazione"
            ? "Preparazione e mise en place"
            : "Inquadramento operativo",
      durationSec: "0–3s",
      camera: camera.hook,
      visualAction: scene1Action,
      voiceover:
        brief.purpose === "promozione"
          ? `Ecco cosa rende speciale ${brief.topic.toLowerCase()} da ${locale}.`
          : brief.purpose === "formazione"
            ? `Procedura operativa: ${brief.topic}. Prepariamo la postazione secondo lo standard del locale.`
            : `Analisi operativa: ${brief.topic} per ottimizzare ${area.title.toLowerCase()}.`,
      onScreenText: `${brief.topic} · ${brief.restaurantName || area.title}`,
      aiPrompt: `${camera.hook}. ${scene1Action}`,
    },
    {
      number: 2,
      title:
        brief.purpose === "promozione"
          ? "Lavorazione e racconto del valore"
          : brief.purpose === "formazione"
            ? "Gesto tecnico e procedura"
            : "Metodo e controllo in servizio",
      durationSec: "3–7s",
      camera: camera.body,
      visualAction: scene2Action,
      voiceover:
        details ||
        `Cura di ogni dettaglio su ${brief.topic.toLowerCase()}, mantenendo coerenza e qualità ad ogni servizio.`,
      onScreenText:
        brief.signatureOffer ||
        `${PURPOSES[brief.purpose]} · ${STYLES[brief.style]}`,
      aiPrompt: `${camera.body}. ${scene2Action}`,
    },
    {
      number: 3,
      title:
        brief.purpose === "promozione"
          ? "Presentazione finale e invito"
          : brief.purpose === "formazione"
            ? "Verifica dello standard"
            : "Riepilogo e azione per il locale",
      durationSec: "7–10s",
      camera: camera.close,
      visualAction: scene3Action,
      voiceover: cta,
      onScreenText: cta,
      aiPrompt: `${camera.close}. ${scene3Action}`,
    },
  ]

  return {
    projectTitle: `${brief.restaurantName ? `${brief.restaurantName} — ` : ""}${brief.topic}`,
    recommendedFormat,
    recommendedAspectRatio,
    ...(isSafety
      ? {
          complianceNote:
            "Attenzione: per HACCP, sicurezza alimentare e allergeni verifica sempre i testi con il manuale di autocontrollo approvato dal responsabile del locale.",
        }
      : {}),
    scenes,
    combinedAiPrompt: scenes
      .map(
        (scene) =>
          `[Scena ${scene.number} · ${scene.durationSec}] ${scene.aiPrompt}`
      )
      .join(" "),
  }
}
