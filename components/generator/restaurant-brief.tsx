"use client"

import { useState } from "react"
import {
  BookmarkCheck,
  Check,
  Clapperboard,
  Download,
  FileText,
  Sparkles,
} from "lucide-react"

import { saveBrandKitAction } from "@/app/actions/account"
import { useApp, useToast } from "@/components/providers/app-providers"
import { PURPOSES, STYLES } from "@/lib/restaurant/brief"
import { RESTAURANT_AREAS, restaurantArea } from "@/lib/restaurant/catalog"
import {
  buildRestaurantStoryboard,
  type RestaurantStoryboard,
} from "@/lib/restaurant/storyboard"

import type { Generator } from "./use-generator"

const field =
  "mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-page px-3 text-sm text-foreground outline-none focus:border-lime"

export function RestaurantBriefCard({ generator }: { generator: Generator }) {
  const { user } = useApp()
  const toast = useToast()
  const brief = generator.restaurantBrief
  const brandKit = generator.brandKit
  const area = restaurantArea(brief.areaId)!

  const [showBrandExtra, setShowBrandExtra] = useState(
    Boolean(brief.cuisineType || brief.signatureOffer)
  )
  const [storyboard, setStoryboard] = useState<RestaurantStoryboard | null>(
    null
  )
  const [savingKit, setSavingKit] = useState(false)

  const handleSaveBrandKit = async () => {
    const nextKit = {
      ...brandKit,
      restaurantName: brief.restaurantName || brandKit.restaurantName,
      cuisineType: brief.cuisineType || brandKit.cuisineType,
      signatureOffer: brief.signatureOffer || brandKit.signatureOffer,
      defaultCallToAction: brief.callToAction || brandKit.defaultCallToAction,
      defaultStyle: brief.style,
    }
    generator.setBrandKit(nextKit)
    if (user) {
      setSavingKit(true)
      const res = await saveBrandKitAction(nextKit)
      setSavingKit(false)
      if (!res.ok) {
        toast.error("Impossibile salvare il Brand Kit", res.error)
        return
      }
    }
    toast.info("Brand Kit del locale salvato per i prossimi video")
  }

  const handleCreateStoryboard = () => {
    const built = buildRestaurantStoryboard(brief, generator.prompt)
    setStoryboard(built)
  }

  const handleDownloadScript = () => {
    if (!storyboard) return
    const lines = [
      `RISTOREEL (ristoreel.it) — PIANO DI PRODUZIONE & COPIONE`,
      `Progetto: ${storyboard.projectTitle}`,
      `Ambito: ${area.number}. ${area.title} — ${brief.topic}`,
      `Obiettivo: ${PURPOSES[brief.purpose]} · Stile: ${STYLES[brief.style]}`,
      `Formato consigliato: ${storyboard.recommendedFormat}`,
      storyboard.complianceNote ? `Nota: ${storyboard.complianceNote}` : "",
      "",
      ...storyboard.scenes.flatMap((scene) => [
        `--- SCENA ${scene.number}: ${scene.title} (${scene.durationSec}) ---`,
        `Regia / Inquadratura: ${scene.camera}`,
        `Azione visiva: ${scene.visualAction}`,
        `Voce / Parlato: "${scene.voiceover}"`,
        `Testo a schermo: ${scene.onScreenText}`,
        `Prompt AI Scena ${scene.number}: ${scene.aiPrompt}`,
        "",
      ]),
    ].filter((line) => line !== undefined)
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `copione-${brief.areaId}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section
      aria-label="Il tuo progetto ristorazione"
      className="space-y-3 rounded-2xl bg-surface p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Il tuo progetto</h2>
        <span className="rounded-full bg-lime/10 px-2 py-1 text-[10px] text-lime">
          RISTORAZIONE
        </span>
      </div>
      <label className="block text-xs text-muted-foreground">
        Ambito
        <select
          aria-label="Ambito"
          className={field}
          value={brief.areaId}
          onChange={(e) => generator.chooseArea(e.target.value)}
        >
          {RESTAURANT_AREAS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.number}. {item.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted-foreground">
        Sottoargomento
        <select
          aria-label="Sottoargomento"
          className={field}
          value={brief.topic}
          onChange={(e) =>
            generator.updateRestaurant({ topic: e.target.value })
          }
        >
          {area.topics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted-foreground">
        Obiettivo
        <select
          aria-label="Obiettivo"
          className={field}
          value={brief.purpose}
          onChange={(e) =>
            generator.updateRestaurant({
              purpose: e.target.value as keyof typeof PURPOSES,
            })
          }
        >
          {Object.entries(PURPOSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-muted-foreground">
          Nome del locale
          <input
            aria-label="Nome del locale"
            className={field}
            maxLength={120}
            placeholder="Il tuo ristorante"
            value={brief.restaurantName}
            onChange={(e) =>
              generator.updateRestaurant({ restaurantName: e.target.value })
            }
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          Stile
          <select
            aria-label="Stile"
            className={field}
            value={brief.style}
            onChange={(e) =>
              generator.updateRestaurant({
                style: e.target.value as keyof typeof STYLES,
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
      <label className="block text-xs text-muted-foreground">
        Invito finale (facoltativo)
        <input
          aria-label="Invito finale"
          className={field}
          maxLength={160}
          placeholder="Prenota il tuo tavolo"
          value={brief.callToAction}
          onChange={(e) =>
            generator.updateRestaurant({ callToAction: e.target.value })
          }
        />
      </label>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => setShowBrandExtra((prev) => !prev)}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-panel px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <BookmarkCheck className="size-3.5 text-lime" />
          {showBrandExtra ? "Chiudi Brand Kit" : "Brand Kit locale"}
        </button>
        {brandKit.restaurantName ? (
          <button
            type="button"
            onClick={() => {
              generator.applyBrandKit()
              toast.info(`Brand Kit "${brandKit.restaurantName}" applicato`)
            }}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-lime/15 px-2.5 text-[11px] font-medium text-lime hover:bg-lime/25"
          >
            <Check className="size-3" /> Usa {brandKit.restaurantName}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleCreateStoryboard}
          className="ml-auto inline-flex h-7 items-center gap-1 rounded-lg border border-lime/30 bg-lime/10 px-2.5 text-[11px] font-semibold text-lime transition-colors hover:bg-lime/20"
        >
          <Clapperboard className="size-3.5" />
          Copione 3 scene (0 crediti)
        </button>
      </div>

      {showBrandExtra ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-panel p-2.5">
          <p className="text-[11px] font-medium text-foreground">
            Dettagli Brand Kit del Ristorante
          </p>
          <label className="block text-xs text-muted-foreground">
            Tipo di cucina / Format
            <input
              aria-label="Tipo di cucina"
              className={field}
              maxLength={120}
              placeholder="Es. Trattoria contemporanea di pesce"
              value={brief.cuisineType ?? ""}
              onChange={(e) =>
                generator.updateRestaurant({
                  cuisineType: e.target.value || undefined,
                })
              }
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Specialità / Offerta reale del locale
            <input
              aria-label="Specialità del locale"
              className={field}
              maxLength={240}
              placeholder="Es. Crudi del giorno e pasta fatta in casa"
              value={brief.signatureOffer ?? ""}
              onChange={(e) =>
                generator.updateRestaurant({
                  signatureOffer: e.target.value || undefined,
                })
              }
            />
          </label>
          <button
            type="button"
            disabled={savingKit}
            onClick={() => void handleSaveBrandKit()}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-foreground hover:bg-white/15"
          >
            <BookmarkCheck className="size-3.5 text-lime" />
            {savingKit
              ? "Salvataggio…"
              : "Salva come Brand Kit predefinito del locale"}
          </button>
        </div>
      ) : null}

      {storyboard ? (
        <div className="space-y-2.5 rounded-xl border border-lime/30 bg-panel p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-lime">
                <Sparkles className="size-3" /> Copione & Storyboard (Gratis)
              </span>
              <p className="text-xs font-semibold text-foreground">
                {storyboard.projectTitle}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {storyboard.recommendedFormat}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadScript}
              title="Scarica copione completo (.txt)"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-medium text-foreground hover:bg-white/15"
            >
              <Download className="size-3" /> .txt
            </button>
          </div>

          {storyboard.complianceNote ? (
            <p className="rounded-lg bg-[#ffbe4c]/10 p-2 text-[11px] text-[#ffd98a]">
              {storyboard.complianceNote}
            </p>
          ) : null}

          <div className="space-y-2">
            {storyboard.scenes.map((scene) => (
              <div
                key={scene.number}
                className="rounded-lg border border-white/5 bg-surface p-2 text-[11px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-lime">
                    Scena {scene.number} ({scene.durationSec}) · {scene.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      generator.setPrompt(scene.aiPrompt)
                      toast.info(
                        `Scena ${scene.number} caricata nella descrizione video`
                      )
                    }}
                    className="rounded bg-lime/15 px-2 py-0.5 text-[10px] font-semibold text-lime hover:bg-lime/25"
                  >
                    Usa Scena {scene.number}
                  </button>
                </div>
                <p className="mt-1 text-muted-foreground">
                  <strong className="text-foreground/85">Inquadratura:</strong>{" "}
                  {scene.camera}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  <strong className="text-foreground/85">Voce/Testo:</strong> “
                  {scene.voiceover}”
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              generator.setPrompt(storyboard.combinedAiPrompt)
              toast.info("Sequenza completa in 3 scene caricata nel prompt AI")
            }}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-lime/15 px-3 text-xs font-semibold text-lime hover:bg-lime/25"
          >
            <FileText className="size-3.5" /> Carica sequenza completa nel
            prompt video
          </button>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Progetta gratis copione e scene, poi usa i crediti solo quando avvii la
        generazione video AI.
      </p>
    </section>
  )
}
