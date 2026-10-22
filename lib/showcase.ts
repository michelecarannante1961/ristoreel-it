/**
 * Media we generated ourselves (with Soul 2 and Kling 3.0) for marketing
 * surfaces: auth carousel, hero, model cards and how-it-works steps. Files
 * live in /public/media. Replace freely with newer generations.
 */
export const SHOWCASE = [
  {
    src: "/media/ristorazione/piatto.jpg",
    chip: "Soul 2",
    title: "Ogni piatto, una storia",
    caption: "Ingredienti, consistenze e luce per raccontare la tua cucina.",
  },
  {
    src: "/media/ristorazione/cucina.jpg",
    chip: "Seedance 2.5",
    title: "Le persone del tuo ristorante",
    caption: "Gesti, preparazioni e servizio diventano una storia.",
  },
  {
    src: "/media/ristorazione/sala.jpg",
    chip: "Kling 3.0",
    title: "Uno studio per il tuo locale",
    caption: "Scegli il modello adatto alla scena e verifica il preventivo.",
  },
  {
    src: "/media/ristorazione/vino.jpg",
    chip: "Effects",
    title: "La tua prossima idea",
    caption: "Parti da uno dei 20 percorsi dedicati alla ristorazione.",
  },
] as const

/** Cover image per model family (picker cards and the model card). */
export const FAMILY_COVERS: Record<string, string> = {
  Seedance: "/media/ristorazione/piatto.jpg",
  Kling: "/media/ristorazione/piatto.jpg",
  Wan: "/media/ristorazione/piatto.jpg",
  "Cinema Studio": "/media/ristorazione/piatto.jpg",
  MiniMax: "/media/ristorazione/piatto.jpg",
  "Happy Horse": "/media/ristorazione/piatto.jpg",
  LTX: "/media/ristorazione/piatto.jpg",
  PixVerse: "/media/ristorazione/piatto.jpg",
  Grok: "/media/ristorazione/piatto.jpg",
  Genjutsu: "/media/ristorazione/cucina.jpg",
  Soul: "/media/ristorazione/piatto.jpg",
  "Marketing Studio": "/media/ristorazione/piatto.jpg",
  Recraft: "/media/ristorazione/piatto.jpg",
  Qwen: "/media/ristorazione/piatto.jpg",
  Ideogram: "/media/ristorazione/piatto.jpg",
  "Z-Image": "/media/ristorazione/piatto.jpg",
}

/** Looping preview videos for model cards (falls back to the cover image). */
export const FAMILY_LOOPS: Record<string, string> = {}

export function familyCover(
  family: string,
  surface: "image" | "video" | "audio"
): string {
  return (
    FAMILY_COVERS[family] ??
    (surface === "image"
      ? "/media/ristorazione/piatto.jpg"
      : "/media/ristorazione/piatto.jpg")
  )
}

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
      title: "Aggiungi i tuoi materiali",
      body: "Carica una foto reale del piatto, della cucina o del locale.",
      image: "/media/ristorazione/ingredienti.jpg",
    },
    {
      title: "Scegli la tua regia",
      body: "Scegli modello, formato e movimento della camera.",
      image: "/media/ristorazione/cucina.jpg",
      video: "/media/ristorazione/chef-regia.mp4",
    },
    {
      title: "Controlla e genera",
      body: "Verifica il preventivo: la clip sarà disponibile tra i tuoi video.",
      image: "/media/ristorazione/piatto.jpg",
    },
  ],
  image: [
    {
      title: "Descrivi la scena",
      body: "Racconta il piatto, l’atmosfera e l’inquadratura desiderata.",
      image: "/media/ristorazione/cucina.jpg",
    },
    {
      title: "Scegli il modello",
      body: "Crea i fotogrammi di riferimento per il video del ristorante.",
      image: "/media/ristorazione/ingredienti.jpg",
    },
    {
      title: "Ritrova i tuoi fotogrammi",
      body: "Usa il risultato come primo fotogramma del tuo video.",
      image: "/media/ristorazione/piatto.jpg",
    },
  ],
  audio: [
    {
      title: "Write a prompt",
      body: "Describe the sound, voice or music you want.",
      image: "/media/ristorazione/cucina.jpg",
    },
    {
      title: "Add a reference",
      body: "Optionally attach audio to steer the result.",
      image: "/media/ristorazione/ingredienti.jpg",
    },
    {
      title: "Get audio",
      body: "Listen, download or use it in a video.",
      image: "/media/ristorazione/piatto.jpg",
    },
  ],
}
