"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"

import { requestMagicLinkAction } from "@/app/actions/auth"
import { BRAND } from "@/lib/brand"

import { LogoMark } from "../site/logo"

/** Magic-link sign-in: one email field, then "check your email". */
export function LoginForm({
  mode = "signup",
  callbackUrl = "/",
  reason,
  onModeChange,
}: {
  mode?: "login" | "signup"
  callbackUrl?: string
  reason?: string
  onModeChange?: (mode: "login" | "signup") => void
}) {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const localDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  const enterDemo = async () => {
    if (!sentTo || pending) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/test/mailbox?to=${encodeURIComponent(sentTo)}`,
        { cache: "no-store" }
      )
      if (!response.ok)
        throw new Error("Accesso demo non disponibile su questo server.")
      const result = (await response.json()) as { url?: string }
      const link = result.url ? new URL(result.url) : null
      if (!link || !link.pathname.startsWith("/api/auth/"))
        throw new Error("Collegamento di accesso non valido.")
      const currentOrigin = window.location.origin
      const cbParam = link.searchParams.get("callbackUrl")
      if (cbParam) {
        try {
          const cbUrl = new URL(cbParam, currentOrigin)
          link.searchParams.set(
            "callbackUrl",
            `${currentOrigin}${cbUrl.pathname}${cbUrl.search}${cbUrl.hash}`
          )
        } catch {
          // keep original callbackUrl
        }
      }
      window.location.assign(`${currentOrigin}${link.pathname}${link.search}`)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Accesso demo non riuscito."
      )
      setPending(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (mode === "signup" && !consent) {
      setError("Accetta termini e informativa sulla privacy per continuare.")
      return
    }
    setPending(true)
    setError(null)
    const result = await requestMagicLinkAction({ email, callbackUrl })
    setPending(false)
    if (result.ok) setSentTo(result.data.email)
    else setError(result.error)
  }

  if (sentTo)
    return (
      <div className="flex flex-col items-start gap-4" aria-live="polite">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-lime/10 text-lime">
          <MailCheck className="size-6" />
        </span>
        <h2 className="text-3xl font-semibold tracking-tight">
          {localDemo ? "Accesso alla demo" : "Controlla la tua email"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {localDemo ? (
            <>
              In questa anteprima non vengono inviate email. Puoi entrare con il
              pulsante qui sotto usando{" "}
              <span className="text-foreground">{sentTo}</span>.
            </>
          ) : (
            <>
              Abbiamo inviato un link di accesso a{" "}
              <span className="text-foreground">{sentTo}</span>. Il link scade
              tra un’ora.
            </>
          )}
        </p>
        {localDemo ? (
          <button
            type="button"
            disabled={pending}
            className="btn-keycap w-full rounded-xl px-4 py-3 text-sm font-semibold"
            onClick={() => void enterDemo()}
          >
            {pending ? "Accesso in corso…" : "Entra nella demo locale"}
          </button>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-[#ff8fb3]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSentTo(null)
            setEmail("")
          }}
        >
          <ArrowLeft className="size-4" /> Usa un’altra email
        </button>
      </div>
    )

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-5" noValidate>
      <LogoMark className="size-8" />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[30px] leading-tight font-semibold tracking-tight">
          {mode === "signup" ? `Benvenuto su ${BRAND.name}` : "Bentornato"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {reason ??
            (mode === "signup"
              ? "Registrati con la tua email, senza password."
              : "Accedi con un link inviato alla tua email.")}
        </p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@ristorante.it"
          className="h-12 rounded-xl border border-white/10 bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-lime/60 focus:outline-none"
        />
      </label>
      {mode === "signup" ? (
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            aria-label="Accetto i Termini di servizio and Informativa sulla privacy"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[#e8a276]"
          />
          <span>
            Accetto i{" "}
            <Link
              href="/legal/terms"
              className="text-foreground underline underline-offset-2"
            >
              Termini di servizio
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="text-foreground underline underline-offset-2"
            >
              Informativa sulla privacy
            </Link>
            .
          </span>
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[#ff6b6b]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !email}
        className="btn-keycap flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Invio del link…" : "Continua con email"}
      </button>
      {onModeChange ? (
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Hai già un account? " : "Prima volta qui? "}
          <button
            type="button"
            className="font-medium text-lime hover:underline"
            onClick={() => {
              setError(null)
              onModeChange(mode === "signup" ? "login" : "signup")
            }}
          >
            {mode === "signup" ? "Accedi" : "Crea un account"}
          </button>
        </p>
      ) : null}
    </form>
  )
}
