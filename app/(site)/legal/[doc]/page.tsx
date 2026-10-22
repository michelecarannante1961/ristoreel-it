import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import { BRAND } from "@/lib/brand"

type Section = { id: string; title: string; body: string[] }
type LegalDoc = { title: string; summary: string; sections: Section[] }

const name = BRAND.name

const DOCS: Record<string, LegalDoc> = {
  terms: {
    title: "Termini di Servizio",
    summary: `Condizioni d'uso di ${name}: account, modello ibrido (copioni gratuiti + video AI a crediti), abbonamenti e ricariche in Euro (€).`,
    sections: [
      {
        id: "agreement",
        title: "1. Oggetto del servizio",
        body: [
          `${name} è una piattaforma software specializzata esclusivamente nella progettazione di copioni, storyboard e produzioni video AI per il settore della ristorazione professionale (promozione del locale, formazione del personale di sala e cucina, spiegazione di processi gestionali).`,
          "Creando un account o utilizzando il servizio per conto di un ristorante, società o agenzia, confermi di avere i poteri per accettare i presenti Termini.",
        ],
      },
      {
        id: "hybrid-model",
        title: "2. Modello Ibrido: Copioni gratuiti e Crediti AI",
        body: [
          "La progettazione testuale di copioni e storyboard in 3 scene sui 20 ambiti della ristorazione è gratuita (0 crediti).",
          "La generazione di video e immagini tramite modelli AI esterni richiede crediti. Il preventivo in crediti viene sempre mostrato prima dell'avvio e ricalcolato sul server in base alla regola commerciale (costo fornitore × 1,50 arrotondato al credito intero).",
          "In caso di generazione non riuscita, annullata o bloccata per variazione del listino fornitore, i crediti vengono rimborsati automaticamente sul saldo dell'utente.",
        ],
      },
      {
        id: "billing",
        title: "3. Abbonamenti e Ricariche in Euro (€)",
        body: [
          "I piani in abbonamento (Trattoria, Ristorante, Gruppo & Agenzia) sono fatturati in Euro (€) con cadenza mensile o annuale tramite Stripe e rinnovano la dotazione mensile di crediti.",
          "I pacchetti di ricarica a consumo (Pay-per-use in Euro €) assegnano crediti che non scadono finché l'account resta attivo. I crediti non sono convertibili in denaro né trasferibili tra account.",
        ],
      },
      {
        id: "content",
        title: "4. Titolarità dei materiali e responsabilità HACCP",
        body: [
          "Il ristoratore mantiene la piena proprietà di fotografie di piatti, sale, loghi, ricette e testi caricati nella piattaforma. Con i piani a pagamento o le ricariche, i video generati possono essere utilizzati commercialmente sui canali social, sito web e materiali formativi del locale.",
          "Per gli ambiti relativi a sicurezza alimentare, HACCP e allergeni, i contenuti generati hanno valore esclusivamente illustrativo e devono essere sempre verificati e approvati dal responsabile del piano di autocontrollo del locale.",
        ],
      },
      {
        id: "contact",
        title: "5. Assistenza e contatti",
        body: [
          `Per qualsiasi richiesta contrattuale, tecnica o di fatturazione puoi scrivere a ${BRAND.supportEmail}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Informativa Privacy (GDPR)",
    summary: `Come ${name} tratta i dati personali e i materiali del tuo ristorante nel rispetto del Regolamento UE 2016/679 (GDPR).`,
    sections: [
      {
        id: "collect",
        title: "1. Dati raccolti",
        body: [
          "Dati dell'account: indirizzo email professionale, nome e impostazioni del profilo.",
          "Brand Kit e materiali del ristorante: nome del locale, tipo di cucina, specialità, copioni e fotografie/video di riferimento caricati nella libreria.",
          "Dati di fatturazione: piano scelto, storico crediti e riferimenti transazione. I dati delle carte di pagamento sono gestiti esclusivamente da Stripe.",
        ],
      },
      {
        id: "use",
        title: "2. Finalità del trattamento",
        body: [
          "Erogazione del servizio di progettazione copioni e generazione video AI, gestione della libreria privata del ristorante, contabilizzazione crediti e invio dei link di accesso e ricevute.",
          "Prevenzione abusi, limiti di frequenza (rate limiting) e tutela della sicurezza dell'infrastruttura.",
        ],
      },
      {
        id: "sharing",
        title: "3. Fornitori tecnologici",
        body: [
          "I prompt compilati e i file di riferimento selezionati per una generazione vengono trasmessi alle API di generazione AI (Higgsfield) al solo scopo di produrre il contenuto richiesto.",
          "Non vendiamo né cediamo a terzi i dati o le fotografie dei ristoranti clienti.",
        ],
      },
      {
        id: "rights",
        title: "4. Diritti dell'interessato",
        body: [
          `Puoi richiedere in qualsiasi momento l'accesso, la rettifica, l'esportazione o la cancellazione dei dati del tuo account scrivendo a ${BRAND.supportEmail}.`,
        ],
      },
    ],
  },
  "acceptable-use": {
    title: "Uso Consentito (Esclusiva Ristorazione)",
    summary: `Regole di utilizzo della piattaforma ${name} e vincolo di destinazione al settore ristorazione.`,
    sections: [
      {
        id: "scope",
        title: "1. Destinazione esclusiva alla ristorazione",
        body: [
          `${name} è riservato alla creazione di contenuti legati a ristoranti, trattorie, pizzerie, bistrot, pasticcerie, bar, catering e ospitalità gastronomica.`,
          "Il server verifica la presenza di un ambito e sottoargomento validi e blocca richieste manifestamente estranee al settore.",
        ],
      },
      {
        id: "truthfulness",
        title: "2. Veridicità verso i consumatori",
        body: [
          "È vietato utilizzare il servizio per generare recensioni false, attribuzioni ingannevoli di marchi DOP/IGP non utilizzati dal locale, certificazioni sanitarie inesistenti o promesse commerciali ingannevoli.",
        ],
      },
      {
        id: "prohibited",
        title: "3. Contenuti vietati",
        body: [
          "È severamente vietato caricare o generare contenuti illeciti, diffamatori, violenti, sessualmente espliciti o lesivi dei diritti d'autore e d'immagine di terzi senza consenso.",
        ],
      },
    ],
  },
}

const SLUGS = Object.keys(DOCS)

export const dynamicParams = false

export function generateStaticParams(): { doc: string }[] {
  return SLUGS.map((doc) => ({ doc }))
}

type Params = Promise<{ doc: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { doc } = await params
  const entry = Object.hasOwn(DOCS, doc) ? DOCS[doc] : undefined
  if (!entry) return { title: "Non trovato" }
  return {
    title: entry.title,
    description: entry.summary,
  }
}

export default async function LegalPage({ params }: { params: Params }) {
  const { doc } = await params
  const entry = Object.hasOwn(DOCS, doc) ? DOCS[doc] : undefined
  if (!entry) notFound()

  return (
    <div className="mx-auto flex w-full max-w-[1096px] flex-col gap-8 px-4 pt-10 md:pt-14">
      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-lime/30 bg-lime/10 p-4 text-sm text-foreground"
      >
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
        <p>
          <strong className="font-semibold text-lime">
            Documentazione contrattuale {name}.
          </strong>{" "}
          Prima del lancio pubblico inserisci la ragione sociale, la Partita IVA
          e il foro competente della tua attività.
        </p>
      </div>

      <nav aria-label="Documenti legali" className="flex flex-wrap gap-2">
        {SLUGS.map((slug) => (
          <Link
            key={slug}
            href={`/legal/${slug}`}
            aria-current={slug === doc ? "page" : undefined}
            className={
              slug === doc
                ? "inline-flex h-8 items-center rounded-lg bg-white/10 px-3 text-sm font-medium text-white"
                : "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            }
          >
            {DOCS[slug]!.title}
          </Link>
        ))}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav
            aria-label="In questa pagina"
            className="sticky top-24 flex flex-col gap-1 text-sm"
          >
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Sezioni
            </p>
            {entry.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md py-1 text-white/60 transition-colors hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="flex max-w-[720px] flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-[36px] leading-tight font-semibold tracking-[-0.02em] md:text-[44px]">
              {entry.title}
            </h1>
            <p className="text-base text-muted-foreground">{entry.summary}</p>
            <p className="text-xs text-white/40">
              Versione aggiornata per il modello ibrido EUR · Ottobre 2026
            </p>
          </header>
          {entry.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-24"
            >
              <h2
                id={`${section.id}-title`}
                className="mb-3 text-lg font-semibold"
              >
                {section.title}
              </h2>
              <div className="flex flex-col gap-3 text-[15px] leading-7 text-white/75">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
