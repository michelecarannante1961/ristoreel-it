/**
 * Media per RistoReel: showcase, copertine differenziate per ogni famiglia
 * e modello AI, e libreria fotografica/video pronta all'uso nello Studio.
 */
import type { AssetLibraryItem } from "@/lib/studio/uploads"

export const SHOWCASE = [
  {
    src: "/media/ristorazione/ambito-04.jpg",
    chip: "Soul 2",
    title: "Ogni piatto, una storia",
    caption: "Ingredienti, consistenze e luce per raccontare la tua cucina.",
  },
  {
    src: "/media/ristorazione/ambito-06.jpg",
    chip: "Seedance 2.5",
    title: "Le persone del tuo ristorante",
    caption: "Gesti, preparazioni e servizio diventano una storia.",
  },
  {
    src: "/media/ristorazione/ambito-07.jpg",
    chip: "Kling 3.0",
    title: "Uno studio per il tuo locale",
    caption: "Scegli il modello adatto alla scena e verifica il preventivo.",
  },
  {
    src: "/media/ristorazione/ambito-10.jpg",
    chip: "Effects",
    title: "La tua prossima idea",
    caption: "Parti da uno dei 20 percorsi dedicati alla ristorazione.",
  },
] as const

/** Cover image differenziata per ogni famiglia di modelli. */
export const FAMILY_COVERS: Record<string, string> = {
  Seedance: "/media/ristorazione/ambito-04.jpg",
  Kling: "/media/ristorazione/ambito-06.jpg",
  Wan: "/media/ristorazione/ambito-08.jpg",
  "Cinema Studio": "/media/ristorazione/ambito-09.jpg",
  MiniMax: "/media/ristorazione/ambito-10.jpg",
  "Happy Horse": "/media/ristorazione/ambito-11.jpg",
  LTX: "/media/ristorazione/ambito-12.jpg",
  PixVerse: "/media/ristorazione/ambito-13.jpg",
  Grok: "/media/ristorazione/ambito-14.jpg",
  Genjutsu: "/media/ristorazione/ambito-15.jpg",
  Soul: "/media/ristorazione/ambito-16.jpg",
  "Marketing Studio": "/media/ristorazione/ambito-17.jpg",
  Recraft: "/media/ristorazione/ambito-18.jpg",
  Qwen: "/media/ristorazione/ambito-19.jpg",
  Ideogram: "/media/ristorazione/ambito-20.jpg",
  "Z-Image": "/media/ristorazione/ambito-05.jpg",
}

/** Copertina specifica per singolo modello (così anche modelli della stessa famiglia hanno foto diverse). */
export const MODEL_COVERS: Record<string, string> = {
  "seedance-2.5": "/media/ristorazione/ambito-04.jpg",
  "seedance-2": "/media/ristorazione/ambito-05.jpg",
  "kling-3-pro": "/media/ristorazione/ambito-06.jpg",
  "kling-3": "/media/ristorazione/ambito-07.jpg",
  "kling-3-4k": "/media/ristorazione/ambito-08.jpg",
  "kling-3-turbo": "/media/ristorazione/ambito-09.jpg",
  "cinema-studio-4": "/media/ristorazione/ambito-10.jpg",
  "kling-2.6": "/media/ristorazione/ambito-11.jpg",
  "kling-2.5-turbo": "/media/ristorazione/ambito-12.jpg",
  "kling-2.5-turbo-std": "/media/ristorazione/ambito-13.jpg",
  "wan-3-prime": "/media/ristorazione/ambito-14.jpg",
  "wan-3": "/media/ristorazione/ambito-15.jpg",
  "wan-2.7": "/media/ristorazione/ambito-16.jpg",
  "wan-2.6": "/media/ristorazione/ambito-17.jpg",
  "minimax-h3": "/media/ristorazione/ambito-18.jpg",
  "hailuo-2.3": "/media/ristorazione/ambito-19.jpg",
  "pixverse-v6": "/media/ristorazione/ambito-20.jpg",
}

/** Looping preview videos for model cards (falls back to the cover image). */
export const FAMILY_LOOPS: Record<string, string> = {}

export function familyCover(
  family: string,
  surface: "image" | "video" | "audio",
  modelId?: string
): string {
  if (modelId && MODEL_COVERS[modelId]) return MODEL_COVERS[modelId]!
  return (
    FAMILY_COVERS[family] ??
    (surface === "image"
      ? "/media/ristorazione/ambito-16.jpg"
      : "/media/ristorazione/ambito-04.jpg")
  )
}

/** Catalogo di 20 foto e video della ristorazione differenziati, sempre disponibili nella Libreria dello Studio. */
const STOCK_ITEMS: Omit<AssetLibraryItem, "createdAt">[] = [
  {
    id: "stock-04",
    src: "/media/ristorazione/ambito-04.jpg",
    kind: "image",
    name: "04 · Sala e Accoglienza Ospiti",
    source: "generation",
  },
  {
    id: "stock-05",
    src: "/media/ristorazione/ambito-05.jpg",
    kind: "image",
    name: "05 · Esperienza al Tavolo",
    source: "generation",
  },
  {
    id: "stock-06",
    src: "/media/ristorazione/ambito-06.jpg",
    kind: "image",
    name: "06 · Cantina, Vini e Calici",
    source: "generation",
  },
  {
    id: "stock-07",
    src: "/media/ristorazione/ambito-07.jpg",
    kind: "image",
    name: "07 · Cocktail Bar e Aperitivo",
    source: "generation",
  },
  {
    id: "stock-08",
    src: "/media/ristorazione/ambito-08.jpg",
    kind: "image",
    name: "08 · Pizzeria, Forno e Lievitati",
    source: "generation",
  },
  {
    id: "stock-09",
    src: "/media/ristorazione/ambito-09.jpg",
    kind: "image",
    name: "09 · Pasticceria e Dessert al Piatto",
    source: "generation",
  },
  {
    id: "stock-10",
    src: "/media/ristorazione/ambito-10.jpg",
    kind: "image",
    name: "10 · Eventi e Cene Speciali",
    source: "generation",
  },
  {
    id: "stock-11",
    src: "/media/ristorazione/ambito-11.jpg",
    kind: "image",
    name: "11 · Materie Prime e Fornitori",
    source: "generation",
  },
  {
    id: "stock-12",
    src: "/media/ristorazione/ambito-12.jpg",
    kind: "image",
    name: "12 · Brigata e Lavoro di Squadra",
    source: "generation",
  },
  {
    id: "stock-13",
    src: "/media/ristorazione/ambito-13.jpg",
    kind: "image",
    name: "13 · Impiattamento dello Chef",
    source: "generation",
  },
  {
    id: "stock-14",
    src: "/media/ristorazione/ambito-14.jpg",
    kind: "image",
    name: "14 · Atmosfera Serale del Locale",
    source: "generation",
  },
  {
    id: "stock-15",
    src: "/media/ristorazione/ambito-15.jpg",
    kind: "image",
    name: "15 · Preparazione in Cucina",
    source: "generation",
  },
  {
    id: "stock-16",
    src: "/media/ristorazione/ambito-16.jpg",
    kind: "image",
    name: "16 · Dettaglio Ingredienti Freschi",
    source: "generation",
  },
  {
    id: "stock-17",
    src: "/media/ristorazione/ambito-17.jpg",
    kind: "image",
    name: "17 · Servizio e Mise en Place",
    source: "generation",
  },
  {
    id: "stock-18",
    src: "/media/ristorazione/ambito-18.jpg",
    kind: "image",
    name: "18 · Degustazione e Abbinamenti",
    source: "generation",
  },
  {
    id: "stock-19",
    src: "/media/ristorazione/ambito-19.jpg",
    kind: "image",
    name: "19 · Racconto del Territorio",
    source: "generation",
  },
  {
    id: "stock-20",
    src: "/media/ristorazione/ambito-20.jpg",
    kind: "image",
    name: "20 · Ospitalità e Sorriso in Sala",
    source: "generation",
  },
  {
    id: "stock-v1",
    src: "/media/ristorazione/ambito-01.mp4",
    kind: "video",
    name: "Video 01 · Presentazione Piatto",
    source: "generation",
  },
  {
    id: "stock-v2",
    src: "/media/ristorazione/ambito-02.mp4",
    kind: "video",
    name: "Video 02 · Ingredienti e Food Cost",
    source: "generation",
  },
  {
    id: "stock-v3",
    src: "/media/ristorazione/ambito-03.mp4",
    kind: "video",
    name: "Video 03 · Brigata in Cucina",
    source: "generation",
  },
  {
    id: "stock-chef-pasta-audio",
    src: "/media/ristorazione/chef-pasta-audio.mp4",
    kind: "video",
    name: "Chef Salta la Pasta (con Effetti Audio)",
    source: "generation",
  },
  {
    id: "stock-chef-pasta-muto",
    src: "/media/ristorazione/chef-pasta-muto.mp4",
    kind: "video",
    name: "Chef Salta la Pasta (Silenzioso/Muto)",
    source: "generation",
  },
]

export const RESTAURANT_STOCK_LIBRARY: AssetLibraryItem[] = STOCK_ITEMS.map(
  (item, idx) => ({ ...item, createdAt: idx + 1 })
)

export const FREE_PHOTO_SITES = [
  {
    name: "Pexels Ristorazione",
    description: "Migliaia di foto e video gratis di piatti, chef e ristoranti",
    url: "https://www.pexels.com/it-it/cerca/ristorante%20cibo%20chef/",
  },
  {
    name: "Unsplash Food & Chef",
    description: "Fotografie editoriali ad alta risoluzione di alta cucina",
    url: "https://unsplash.com/it/s/foto/restaurant-food-chef",
  },
  {
    name: "Pixabay Cucina Italiana",
    description: "Immagini gratuite di pasta, pizza, vini e ingredienti",
    url: "https://pixabay.com/it/images/search/ristorante%20cucina%20italiana/",
  },
] as const

export const HERO = {
  image: "/media/hero/coast.jpg",
  video: "/media/loops/hero.mp4",
  mark: "/media/hero/songbird.jpg",
}

export type StepItem = {
  title: string
  body: string
  image: string
  video?: string
}

/** "How it works" steps on the generator canvas. */
export const STEPS: Record<"video" | "image" | "audio", readonly StepItem[]> = {
  video: [
    {
      title: "Video muto o fotogramma",
      body: "Genera clip rapide silenziose o anima una foto del locale.",
      image: "/media/ristorazione/ambito-16.jpg",
      video: "/media/ristorazione/chef-pasta-muto.mp4",
    },
    {
      title: "Scegli la tua regia",
      body: "Scegli modello, formato e movimento della camera.",
      image: "/media/ristorazione/ambito-13.jpg",
      video: "/media/ristorazione/chef-regia.mp4",
    },
    {
      title: "Audio ed effetti immersivi",
      body: "Aggiungi suoni reali di cucina, padelle e atmosfera del locale.",
      image: "/media/ristorazione/ambito-04.jpg",
      video: "/media/ristorazione/chef-pasta-audio.mp4",
    },
  ],
  image: [
    {
      title: "Descrivi la scena",
      body: "Racconta il piatto, l’atmosfera e l’inquadratura desiderata.",
      image: "/media/ristorazione/ambito-15.jpg",
    },
    {
      title: "Scegli il modello",
      body: "Crea i fotogrammi di riferimento per il video del ristorante.",
      image: "/media/ristorazione/ambito-16.jpg",
    },
    {
      title: "Ritrova i tuoi fotogrammi",
      body: "Usa il risultato come primo fotogramma del tuo video.",
      image: "/media/ristorazione/ambito-04.jpg",
    },
  ],
  audio: [
    {
      title: "Write a prompt",
      body: "Describe the sound, voice or music you want.",
      image: "/media/ristorazione/ambito-15.jpg",
    },
    {
      title: "Add a reference",
      body: "Optionally attach audio to steer the result.",
      image: "/media/ristorazione/ambito-16.jpg",
    },
    {
      title: "Get audio",
      body: "Listen, download or use it in a video.",
      image: "/media/ristorazione/ambito-04.jpg",
    },
  ],
}
