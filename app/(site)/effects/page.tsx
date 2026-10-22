import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles, Wand2 } from "lucide-react"

import { Atmosphere } from "@/components/marketing/atmosphere"
import { loadEffects } from "@/components/marketing/data"
import { EffectsGallery } from "@/components/marketing/effects-gallery"
import { EmptyCard } from "@/components/marketing/empty-card"
import { PRESET_CATEGORIES } from "@/lib/presets/seed-data"

export const metadata: Metadata = {
  title: "Stili e regia",
  description:
    "Percorsi visivi per i 20 ambiti della ristorazione: scegli un tema, aggiungi i tuoi materiali e crea.",
  openGraph: { images: ["/media/ristorazione/piatto.jpg"] },
}

export default async function EffectsPage() {
  const effects = await loadEffects()
  return (
    <div className="flex flex-col">
      <section
        aria-labelledby="effects-title"
        className="relative isolate overflow-hidden bg-gradient-to-b from-black from-60% to-page"
      >
        <Atmosphere glow="top" className="-z-10" />
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-5 px-4 pt-12 pb-10 md:items-center md:pt-20 md:pb-14 md:text-center">
          <Link
            href="/video"
            className="font-display inline-flex h-8 items-center gap-1.5 rounded-full bg-lime/15 px-3 text-[13px] text-lime shadow-[0_0_24px_rgba(232,162,118,0.25)] transition-colors hover:bg-lime/25"
          >
            <Sparkles className="size-3.5" aria-hidden /> Apri lo studio
          </Link>
          <h1
            id="effects-title"
            className="font-display text-[44px] leading-[0.95] tracking-[-0.04em] text-lime md:text-[96px] md:leading-[100px]"
          >
            Stili e regia
          </h1>
          <p className="max-w-[560px] text-sm text-muted-foreground md:text-base">
            Percorsi per i 20 ambiti della ristorazione. Scegli il tema,
            descrivi la scena e aggiungi i tuoi materiali di riferimento.
          </p>
        </div>
      </section>
      <section
        aria-label="Stili per la ristorazione"
        className="mx-auto w-full max-w-[1440px] px-4"
      >
        {effects.length > 0 ? (
          <EffectsGallery effects={effects} categories={PRESET_CATEGORIES} />
        ) : (
          <EmptyCard
            icon={<Wand2 className="size-5" aria-hidden />}
            title="I percorsi non sono disponibili in questo momento"
            body="Puoi comunque creare un progetto direttamente nello studio video."
            action={
              <Link
                href="/video"
                className="btn-keycap inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-semibold"
              >
                <Sparkles className="size-4" aria-hidden /> Apri il generatore
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}
