"use client"

import Link from "next/link"
import { Fragment, useState } from "react"
import { Check, ChevronDown, Loader2, X } from "lucide-react"

import {
  formatEuro,
  IntervalToggle,
  PlanGrid,
  TopupGrid,
  useCheckout,
} from "@/components/billing/plan-cards"
import { useApp } from "@/components/providers/app-providers"
import { activeSurfaces } from "@/generation/catalog"
import {
  PLANS,
  type BillingInterval,
  type Plan,
  type PlanId,
} from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

const ORDER: PlanId[] = ["free", "starter", "plus", "ultra"]

function hasFeature(plan: Plan, keyword: string): boolean {
  return plan.features.some(
    (feature) =>
      feature.label.toLowerCase().includes(keyword.toLowerCase()) &&
      feature.included
  )
}

/** A value, a check / cross, or [full, compact] text for narrow screens. */
type Cell = string | boolean | readonly [string, string]
type Row = { label: string; hint?: string; values: (plan: Plan) => Cell }

function rowGroups(): { title: string; rows: Row[] }[] {
  const surfaces = activeSurfaces()
  const parallel: Row[] = [
    {
      label: "Generazioni video AI in parallelo",
      values: (plan) => String(plan.concurrency.video),
    },
    {
      label: "Generazioni immagini AI in parallelo",
      values: (plan) => String(plan.concurrency.image),
    },
  ]
  if (surfaces.includes("audio"))
    parallel.push({
      label: "Generazioni audio in parallelo",
      values: (plan) => String(plan.concurrency.audio),
    })
  return [
    {
      title: "Crediti e Copioni",
      rows: [
        {
          label: "Copioni & Storyboard 3 scene",
          hint: "Su tutti i 20 ambiti della ristorazione",
          values: () => "Gratis (0 crediti)",
        },
        {
          label: "Crediti mensili inclusi",
          hint: "Ricaricati a ogni rinnovo mensile",
          values: (plan) =>
            plan.monthlyCredits
              ? plan.monthlyCredits.toLocaleString("it-IT")
              : (["Solo ricariche", "—"] as const),
        },
        {
          label: "Bonus sulle ricariche a consumo",
          hint: "Crediti extra su ogni pacchetto",
          values: (plan) =>
            plan.topupMultiplier > 1
              ? `+${Math.round((plan.topupMultiplier - 1) * 100)}%`
              : false,
        },
      ],
    },
    {
      title: "Produzione AI",
      rows: [
        ...parallel,
        { label: "Tutti i modelli video e immagine", values: () => true },
        {
          label: "Coda prioritaria",
          values: (plan) => hasFeature(plan, "prioritaria"),
        },
      ],
    },
    {
      title: "Diritti e Brand Kit",
      rows: [
        {
          label: "Uso commerciale per il locale",
          values: (plan) => hasFeature(plan, "commerciale"),
        },
        {
          label: "Brand Kit del ristorante e libreria",
          values: () => true,
        },
      ],
    },
  ]
}

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <>
        <Check className="size-4 text-lime" aria-hidden />
        <span className="sr-only">Incluso</span>
      </>
    )
  if (value === false)
    return (
      <>
        <X className="size-4 text-white/30" aria-hidden />
        <span className="sr-only">Non incluso</span>
      </>
    )
  if (typeof value === "string")
    return <span className="tabular-nums">{value}</span>
  return (
    <>
      <span className="hidden tabular-nums md:inline">{value[0]}</span>
      <span className="tabular-nums md:hidden" aria-hidden>
        {value[1]}
      </span>
      <span className="sr-only md:hidden">{value[0]}</span>
    </>
  )
}

function FreeCta({ className }: { className?: string }) {
  const { user, openAuth } = useApp()
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold"
  if (user)
    return (
      <Link
        href="/video"
        className={cn(base, "btn-keycap-white hover:bg-white/90", className)}
      >
        Apri lo Studio
      </Link>
    )
  return (
    <button
      type="button"
      onClick={() => openAuth({ mode: "signup" })}
      className={cn(base, "btn-keycap-white hover:bg-white/90", className)}
    >
      Crea account gratuito
    </button>
  )
}

function FreeCard() {
  const free = PLANS.free
  return (
    <div className="flex flex-col gap-5 rounded-[20px] border border-white/10 bg-panel p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-2xl">{free.name}</h3>
        <p className="text-sm text-muted-foreground">{free.tagline}.</p>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm">
        {free.features
          .filter((feature) => feature.included)
          .map((feature) => (
            <li
              key={feature.label}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-2.5 text-white/85"
            >
              <Check className="size-3.5 text-lime" aria-hidden />{" "}
              {feature.label}
            </li>
          ))}
      </ul>
      <div className="flex items-center gap-4 md:shrink-0">
        <span className="text-3xl font-bold tracking-tight">0 €</span>
        <FreeCta className="h-11 px-5 text-sm" />
      </div>
    </div>
  )
}

function CompareTable({ interval }: { interval: BillingInterval }) {
  const { start, pending } = useCheckout()
  const groups = rowGroups()
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs md:text-sm">
      <caption className="sr-only">Confronto piani RistoReel</caption>
      <colgroup>
        <col className="w-[30%] md:w-[28%]" />
        {ORDER.map((id) => (
          <col key={id} />
        ))}
      </colgroup>
      <thead className="sticky top-[60px] z-10">
        <tr>
          <th
            scope="col"
            className="rounded-tl-3xl bg-panel px-3 pt-5 pb-4 align-bottom md:px-6"
          >
            <span className="sr-only">Funzionalità</span>
            <span
              aria-hidden
              className="block text-[11px] font-normal text-muted-foreground md:hidden"
            >
              Prezzo / mese
            </span>
            <span className="hidden text-xs font-normal text-muted-foreground md:block">
              {interval === "year"
                ? "Prezzi in EUR al mese, fatturazione annuale"
                : "Prezzi in EUR al mese, fatturazione mensile"}
            </span>
          </th>
          {ORDER.map((id, index) => {
            const plan = PLANS[id]
            const value =
              interval === "year" ? plan.priceAnnualPerMonth : plan.priceMonthly
            return (
              <th
                key={id}
                scope="col"
                className={cn(
                  "border-b border-white/5 bg-panel px-1.5 pt-5 pb-4 align-bottom font-normal md:px-3",
                  index === ORDER.length - 1 && "rounded-tr-3xl"
                )}
              >
                <span className="flex flex-col gap-1">
                  <span className="font-display text-[12px] md:text-xl">
                    {plan.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground md:text-sm">
                    {value ? (
                      <>
                        {formatEuro(value)}
                        <span className="hidden md:inline">/mese</span>
                      </>
                    ) : (
                      "0 €"
                    )}
                  </span>
                  <span className="mt-2 hidden md:block">
                    {id === "free" ? (
                      <FreeCta className="h-9 w-full px-3 text-sm" />
                    ) : (
                      <button
                        type="button"
                        disabled={pending === `${id}:${interval}`}
                        onClick={() =>
                          void start({
                            kind: "plan",
                            plan: id as "starter" | "plus" | "ultra",
                            interval,
                          })
                        }
                        className={cn(
                          "flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold disabled:opacity-60",
                          id === "plus"
                            ? "btn-keycap text-[#14151a]"
                            : "bg-raised text-white hover:bg-hover"
                        )}
                      >
                        {pending === `${id}:${interval}` ? (
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : null}
                        Attiva {plan.name}
                      </button>
                    )}
                  </span>
                </span>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <Fragment key={group.title}>
            <tr>
              <th
                scope="colgroup"
                colSpan={ORDER.length + 1}
                className="px-3 pt-7 pb-2 text-base font-semibold text-white md:px-6 md:text-lg"
              >
                {group.title}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="border-b border-white/5 px-3 py-3 align-middle font-normal md:px-6"
                >
                  <span className="block text-white">{row.label}</span>
                  {row.hint ? (
                    <span className="block text-[11px] text-muted-foreground md:text-xs">
                      {row.hint}
                    </span>
                  ) : null}
                </th>
                {ORDER.map((id) => (
                  <td
                    key={id}
                    className="border-b border-white/5 px-1.5 py-3 align-middle text-white/90 md:px-3"
                  >
                    <CellValue value={row.values(PLANS[id])} />
                  </td>
                ))}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

export function PricingView() {
  const [interval, setBillingInterval] = useState<BillingInterval>("year")
  const [compareOpen, setCompareOpen] = useState(false)
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <section
        id="plans"
        aria-labelledby="plans-title"
        className="flex scroll-mt-24 flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="plans-title" className="text-lg font-semibold">
            Piani in abbonamento (EUR €)
          </h2>
          <IntervalToggle value={interval} onChange={setBillingInterval} />
        </div>
        <FreeCard />
        <PlanGrid interval={interval} />
        <p className="text-xs text-muted-foreground">
          Prezzi in Euro (€), IVA ove applicabile calcolata al checkout Stripe.
          Disdici o cambi piano in qualsiasi momento da Account → Fatturazione.
        </p>
      </section>

      <section
        id="topups"
        aria-labelledby="topups-title"
        className="flex scroll-mt-24 flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <h2
            id="topups-title"
            className="font-display text-[28px] leading-9 text-white"
          >
            Ricariche crediti a consumo (Pay-per-use in EUR €)
          </h2>
          <p className="text-sm text-muted-foreground">
            Ideali per nuovi menù stagionali o campagne evento: i crediti
            acquistati con ricarica singola non scadono mai.
          </p>
        </div>
        <TopupGrid />
      </section>

      <section
        aria-labelledby="compare-title"
        className="flex flex-col items-center gap-6"
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2
            id="compare-title"
            className="font-display text-[28px] leading-9 text-white md:text-[40px] md:leading-[48px]"
          >
            Confronta i piani
          </h2>
          <p className="text-sm text-muted-foreground">
            Tutte-le caratteristiche a confronto per singolo locale o catena.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={compareOpen}
          aria-controls="compare-table"
          onClick={() => setCompareOpen((open) => !open)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          {compareOpen ? "Nascondi tabella" : "Mostra confronto dettagliato"}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              compareOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        <div
          id="compare-table"
          hidden={!compareOpen}
          className="w-full rounded-3xl border border-hairline bg-panel pb-4"
        >
          {compareOpen ? <CompareTable interval={interval} /> : null}
        </div>
      </section>
    </div>
  )
}
