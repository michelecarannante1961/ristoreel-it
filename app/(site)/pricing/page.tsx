import Link from "next/link"
import { ArrowUpRight, Clapperboard, Clock3, Monitor, Sparkles } from "lucide-react"
import type { Metadata } from "next"

import { PricingView } from "@/components/marketing/pricing-view"

export const metadata: Metadata = {
  title: "Piani, Ricariche in Euro e Preventivo Video",
  description:
    "Modello ibrido per la ristorazione: copioni e storyboard in 3 scene gratuiti + abbonamenti e ricariche in Euro (€) per generare video AI.",
}

const factors = [
  {
    Icon: Clapperboard,
    title: "1. Copione & Storyboard (0 €)",
    text: "Scegli ambito, argomento e obiettivo: genera e scarica gratuitamente la scaletta in 3 scene con inquadrature e voce narrante.",
  },
  {
    Icon: Sparkles,
    title: "2. Preventivo trasparente (1,5x)",
    text: "Quando avvii la generazione AI del video, conosci sempre in anticipo i crediti richiesti (calcolati sul costo API × 1,50).",
  },
  {
    Icon: Clock3,
    title: "3. Rimborso automatico",
    text: "Se il prezzo del fornitore varia o una generazione non va a buon fine, i crediti vengono protetti e rimborsati automaticamente.",
  },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="risto-eyebrow">MODELLO IBRIDO PER LA RISTORAZIONE</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
        Progetta gratis il copione.
        <br />
        <span className="text-lime">Paga solo i video AI che generi.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground">
        In RistoReel la progettazione di copioni, scene e storyboard per i 20
        ambiti della ristorazione è sempre gratuita. Puoi scegliere un piano
        mensile/annuale in Euro (€) oppure acquistare ricariche crediti a
        consumo che non scadono mai.
      </p>

      <div className="my-12 grid gap-4 md:grid-cols-3">
        {factors.map(({ Icon, title, text }) => (
          <section
            key={title}
            className="rounded-2xl border border-white/10 bg-panel p-6"
          >
            <Icon className="mb-5 text-lime" />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {text}
            </p>
          </section>
        ))}
      </div>

      <PricingView />

      <section className="mt-14 mb-9 rounded-2xl border border-white/10 bg-panel p-6">
        <div className="flex items-center gap-2">
          <Monitor className="size-5 text-lime" />
          <h2 className="text-xl font-semibold">
            Regole di trasparenza sul preventivo nello Studio
          </h2>
        </div>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            Il pulsante <strong>Genera</strong> mostra i crediti esatti
            richiesti per la clip scelta (regola commerciale: costo fornitore ×
            1,50 arrotondato al credito intero).
          </li>
          <li>
            Sotto al pulsante viene mostrata anche la stima indicativa in Euro
            calcolata al cambio ufficiale BCE del giorno.
          </li>
          <li>
            Se il costo live dell&apos;API cambia rispetto al preventivo
            mostrato, il server blocca l&apos;addebito prima della generazione.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Link href="/video" className="risto-primary">
          Apri lo studio video <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  )
}
