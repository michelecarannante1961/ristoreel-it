import type { Metadata } from "next"
import { Suspense } from "react"

import { GeneratorView } from "@/components/generator/generator-view"
import { listPresets, type PresetView } from "@/lib/presets"

export const metadata: Metadata = {
  title: "Crea un video per il tuo ristorante",
  description:
    "Promozione, formazione e gestione: crea video nei 20 ambiti della ristorazione.",
}

async function presets(): Promise<PresetView[]> {
  try {
    return (await listPresets()).filter((preset) => preset.surface === "video")
  } catch {
    return []
  }
}

export default async function VideoPage() {
  return (
    <Suspense>
      <GeneratorView surface="video" presets={await presets()} />
    </Suspense>
  )
}
