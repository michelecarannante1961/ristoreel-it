import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, Sparkle } from "lucide-react"

import { PortalButton } from "@/components/account/portal-button"
import { TopupGrid } from "@/components/billing/plan-cards"
import { getAccount } from "@/lib/account"
import { currentUser } from "@/lib/auth/session"
import { PLANS } from "@/lib/billing/plans"

export const metadata: Metadata = { title: "Fatturazione e Ricariche Crediti" }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/login?callbackUrl=/account/billing")
  const [account, { checkout }] = await Promise.all([
    getAccount(user.objectId),
    searchParams,
  ])
  const plan = PLANS[account.plan]
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Il tuo Ristorante
        </Link>
        <h1 className="font-display text-4xl">Fatturazione e Ricariche (€)</h1>
      </header>

      {checkout === "success" ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-lime/30 bg-lime/10 p-4 text-sm"
        >
          <CheckCircle2 className="size-5 text-lime" />
          Pagamento ricevuto. I crediti vengono accreditati non appena Stripe
          conferma la transazione (di solito in pochi secondi).
        </p>
      ) : null}

      <section className="grid gap-4 rounded-2xl bg-surface p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Piano attuale</p>
          <p className="font-display text-3xl">{plan.name}</p>
          <p className="text-sm text-muted-foreground">
            {account.plan === "free"
              ? "Nessun abbonamento attivo. Copioni 3 scene gratuiti + ricariche a consumo sempre disponibili."
              : `${plan.monthlyCredits.toLocaleString("it-IT")} crediti al mese · fatturazione ${
                  account.planInterval === "year" ? "annuale" : "mensile"
                }${account.planRenewsAt ? ` · rinnovo ${new Date(account.planRenewsAt).toLocaleDateString("it-IT")}` : ""}`}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            <Sparkle className="size-4 fill-lime text-lime" /> Saldo disponibile{" "}
            <span className="font-mono tabular-nums">
              {account.total.toLocaleString("it-IT")} crediti
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {account.hasBillingAccount ? <PortalButton /> : null}
          <Link
            href="/pricing"
            className="btn-keycap flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-[#14151a]"
          >
            {account.plan === "free"
              ? "Scegli un piano in EUR (€)"
              : "Confronta i piani"}
          </Link>
        </div>
      </section>

      {!account.billingEnabled ? (
        <p className="rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
          Il checkout live Stripe in EUR si attiva non appena imposti{" "}
          <code className="text-foreground">STRIPE_SECRET_KEY</code> e gli ID
          dei listini in <code className="text-foreground">.env.local</code>.
        </p>
      ) : null}

      <section id="topups" className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Ricarica crediti a consumo (EUR €)
          </h2>
          <p className="text-sm text-muted-foreground">
            Pacchetti singoli che non scadono mai.{" "}
            {plan.topupMultiplier > 1
              ? `Il tuo piano ${plan.name} aggiunge il +${Math.round((plan.topupMultiplier - 1) * 100)}% di crediti bonus.`
              : "I piani in abbonamento aggiungono fino al +20% di crediti bonus su ogni ricarica."}
          </p>
        </div>
        <TopupGrid currentPlan={account.plan} />
      </section>

      <section className="rounded-2xl bg-surface p-5 text-sm text-muted-foreground">
        Fatture elettroniche/ricevute, metodi di pagamento, cambio piano e
        disdetta sono gestiti nel portale clienti sicuro di Stripe. In caso di
        disdetta mantieni i crediti del piano fino al termine del periodo già
        pagato.
      </section>
    </div>
  )
}
