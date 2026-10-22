"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Sparkles, UtensilsCrossed } from "lucide-react"

import { saveBrandKitAction } from "@/app/actions/account"
import { useToast } from "@/components/providers/app-providers"
import { useRestaurant } from "@/generation/stores/restaurant"
import { STYLES } from "@/lib/restaurant/brief"
import type { RestaurantBrandKit } from "@/lib/restaurant/brand-kit"

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-page px-3 text-sm text-foreground outline-none focus:border-lime"

export function BrandKitCard({ initial }: { initial: RestaurantBrandKit }) {
  const toast = useToast()
  const setStoreKit = useRestaurant((state) => state.setBrandKit)
  const applyStoreKit = useRestaurant((state) => state.applyBrandKit)
  const [form, setForm] = useState<RestaurantBrandKit>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (
      initial.restaurantName ||
      initial.cuisineType ||
      initial.signatureOffer ||
      initial.defaultCallToAction
    ) {
      setStoreKit(initial)
    }
  }, [initial, setStoreKit])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    const result = await saveBrandKitAction(form)
    setSaving(false)
    if (!result.ok) {
      toast.error("Salvataggio non riuscito", result.error)
      return
    }
    setForm(result.data)
    setStoreKit(result.data)
    applyStoreKit(result.data)
    setSaved(true)
    toast.info("Profilo Ristorante & Brand Kit salvato e applicato allo studio")
  }

  return (
    <section
      aria-labelledby="brand-kit-title"
      className="rounded-2xl border border-white/10 bg-surface p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/10 px-2.5 py-1 text-[11px] font-medium text-lime">
            <UtensilsCrossed className="size-3.5" /> BRAND KIT DEL RISTORANTE
          </span>
          <h2 id="brand-kit-title" className="mt-2 font-display text-2xl">
            Identità del locale e riferimenti ricorrenti
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            I dati salvati qui vengono precompilati nello studio video per
            copioni, storyboard e generazioni AI.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs text-muted-foreground">
            Nome del locale
            <input
              className={inputClass}
              maxLength={120}
              placeholder="Es. Osteria Il Melograno"
              value={form.restaurantName}
              onChange={(e) =>
                setForm({ ...form, restaurantName: e.target.value })
              }
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Identità / Tipo di cucina
            <input
              className={inputClass}
              maxLength={120}
              placeholder="Es. Cucina toscana stagionale"
              value={form.cuisineType}
              onChange={(e) =>
                setForm({ ...form, cuisineType: e.target.value })
              }
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Città / Quartiere
            <input
              className={inputClass}
              maxLength={80}
              placeholder="Es. Firenze · Oltrarno"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs text-muted-foreground">
            Piatto simbolo / Offerta distintiva
            <input
              className={inputClass}
              maxLength={240}
              placeholder="Es. Pasta fresca tirata a mano, tartufo e cantina naturale"
              value={form.signatureOffer}
              onChange={(e) =>
                setForm({ ...form, signatureOffer: e.target.value })
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-muted-foreground">
              Invito finale predefinito (CTA)
              <input
                className={inputClass}
                maxLength={160}
                placeholder="Es. Prenota il tuo tavolo"
                value={form.defaultCallToAction}
                onChange={(e) =>
                  setForm({ ...form, defaultCallToAction: e.target.value })
                }
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Stile visivo predefinito
              <select
                className={inputClass}
                value={form.defaultStyle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultStyle: e.target.value as keyof typeof STYLES,
                  })
                }
              >
                {Object.entries(STYLES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Le foto reali di piatti, sala e logo caricate nella Libreria
            restano sempre collegate al tuo account.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="btn-keycap inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#14151a]"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved ? (
              <Check className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Salva Brand Kit e applica allo Studio
          </button>
        </div>
      </form>
    </section>
  )
}
