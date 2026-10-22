import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCard, Sparkle, Video } from "lucide-react"

import { BrandKitCard } from "@/components/account/brand-kit-card"
import { LedgerTable } from "@/components/account/ledger-table"
import { getAccount, listLedger } from "@/lib/account"
import { currentUser } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Account e Profilo Ristorante" }

export default async function AccountPage() {
  const user = await currentUser()
  if (!user) redirect("/login?callbackUrl=/account")
  const [account, ledger] = await Promise.all([
    getAccount(user.objectId),
    listLedger(user.objectId),
  ])
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl">Il tuo Ristorante</h1>
          <p className="text-sm text-muted-foreground">{account.email}</p>
        </div>
        <Link
          href="/video"
          className="btn-keycap inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#14151a]"
        >
          <Video className="size-4" /> Apri Studio Video
        </Link>
      </header>

      <BrandKitCard initial={account.brandKit} />

      <section aria-labelledby="balance" className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-lime/20 bg-gradient-to-b from-lime/10 to-transparent p-5">
          <h2 id="balance" className="text-sm text-muted-foreground">
            Saldo crediti totale
          </h2>
          <p className="flex items-center gap-2 font-mono text-4xl font-semibold tabular-nums">
            <Sparkle className="size-6 fill-lime text-lime" />{" "}
            {account.total.toLocaleString("it-IT")}
          </p>
          <p className="text-xs text-muted-foreground">
            Copioni e storyboard sono sempre gratuiti (0 crediti). I crediti si
            usano solo per generare i video AI.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-5">
          <h2 className="text-sm text-muted-foreground">
            Crediti da abbonamento
          </h2>
          <p className="font-mono text-3xl tabular-nums">
            {account.credits.subscription.toLocaleString("it-IT")}
          </p>
          <p className="text-xs text-muted-foreground">
            {account.plan === "free"
              ? "Attiva un piano mensile o annuale per ricevere crediti ricorrenti."
              : `Si ricaricano ogni mese con il piano ${account.planName}${
                  account.planRenewsAt
                    ? ` · rinnovo ${new Date(account.planRenewsAt).toLocaleDateString("it-IT")}`
                    : ""
                }.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-5">
          <h2 className="text-sm text-muted-foreground">Crediti da ricarica</h2>
          <p className="font-mono text-3xl tabular-nums">
            {account.credits.topup.toLocaleString("it-IT")}
          </p>
          <p className="text-xs text-muted-foreground">
            Non scadono mai e restano sempre nel portafoglio del locale.
          </p>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-sm text-muted-foreground">Piano attivo</p>
          <p className="font-display text-2xl">{account.planName}</p>
          {account.planStatus === "canceling" ? (
            <p className="text-xs text-pink">
              Disdetta programmata a fine periodo.
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href="/account/billing"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-white/5 px-4 text-sm font-medium hover:bg-white/10"
          >
            <CreditCard className="size-4" /> Fatturazione e Ricariche
          </Link>
          <Link
            href="/pricing"
            className="btn-keycap flex h-10 items-center rounded-[10px] px-4 text-sm font-semibold text-[#14151a]"
          >
            {account.plan === "free" ? "Scegli un piano (€)" : "Cambia piano"}
          </Link>
        </div>
      </section>

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className="text-lg font-semibold">
          Movimenti crediti
        </h2>
        <LedgerTable initial={ledger.items} initialCursor={ledger.nextCursor} />
      </section>
    </div>
  )
}
