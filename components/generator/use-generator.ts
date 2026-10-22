"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useApp, useToast } from "@/components/providers/app-providers"
import {
  findModel,
  getModel,
  modelsFor,
  parseSettings,
  tabsFor,
} from "@/generation/catalog"
import {
  changeImageRole,
  groupMedia,
  inferInputMode,
  inputRoles,
  mergeMedia,
  mergeReferences,
} from "@/generation/catalog/media-inputs"
import type {
  GenerationPlane,
  GeneratorTab,
  MediaItem,
  MediaRole,
  ModelEntry,
  Surface,
} from "@/generation/catalog/types"
import { activeModelId, useDock } from "@/generation/stores/dock"
import { useSettings } from "@/generation/stores/settings"
import { useRestaurant } from "@/generation/stores/restaurant"
import { restaurantPrompt } from "@/lib/restaurant/brief"
import { PURPOSES } from "@/lib/restaurant/brief"
import { restaurantArea } from "@/lib/restaurant/catalog"
import { toPlatform } from "@/generation/to-platform"
import { tryPriceFor } from "@/lib/billing/price"
import type { GenerationView } from "@/lib/generations/view"
import type { PresetView } from "@/lib/presets"
import { runToLibraryItems } from "@/lib/studio/gallery-items"
import {
  uploadAsset,
  uploadToLibraryItem,
  useUploads,
  type AssetSelection,
} from "@/lib/studio/uploads"
import { useHydrated } from "@/lib/studio/local-flag"
import { useRuns } from "@/lib/studio/use-runs"

export type Generator = ReturnType<typeof useGenerator>

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16)
      )
}

/** Apply a preset's template to the user's text ("{subject}" placeholder). */
export function presetPrompt(template: string, subject: string): string {
  const clean = subject.trim()
  return template.includes("{subject}")
    ? template.replace("{subject}", clean || "a striking subject").trim()
    : `${clean ? `${clean}, ` : ""}${template}`
}

/**
 * The generator's single controlled state (template rule: one dock state
 * shared by every view): model, tab, prompt, media, settings, runs, price.
 */
export function useGenerator(surface: Surface, presets: PresetView[] = []) {
  const { user, pricing, openAuth, openUpgrade } = useApp()
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const dock = useDock((state) => state.surfaces[surface])
  const setTab = useDock((state) => state.setTab)
  const setModelId = useDock((state) => state.setModel)
  const setPromptState = useDock((state) => state.setPrompt)
  const setMediaState = useDock((state) => state.setMedia)
  const setPreset = useDock((state) => state.setPreset)
  const settingsByModel = useSettings((state) => state.byModel)
  const setSetting = useSettings((state) => state.set)
  // zustand/persist rehydrates from localStorage on the client only.
  const hydrated = useHydrated()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pendingResume = useRef(false)
  const restaurantBrief = useRestaurant((state) => state.brief)
  const brandKit = useRestaurant((state) => state.brandKit)
  const updateRestaurant = useRestaurant((state) => state.update)
  const chooseArea = useRestaurant((state) => state.chooseArea)
  const setBrandKit = useRestaurant((state) => state.setBrandKit)
  const applyBrandKit = useRestaurant((state) => state.applyBrandKit)

  const disabled = useMemo(() => new Set(pricing.disabled), [pricing.disabled])
  const tabs = useMemo(() => tabsFor(surface), [surface])
  const tab: GeneratorTab = tabs.includes(dock.tab)
    ? dock.tab
    : (tabs[0] ?? "create")
  const models = useMemo(
    () => modelsFor(surface, tab).filter((model) => !disabled.has(model.id)),
    [disabled, surface, tab]
  )
  const allModels = useMemo(
    () => modelsFor(surface).filter((model) => !disabled.has(model.id)),
    [disabled, surface]
  )
  const model: ModelEntry | undefined = useMemo(() => {
    const id = activeModelId(surface, { ...dock, tab })
    const chosen = id ? findModel(id) : undefined
    return chosen && !disabled.has(chosen.id) ? chosen : models[0]
  }, [disabled, dock, models, surface, tab])

  const preset = presets.find(
    (item) => item.id === dock.presetId && item.surface === surface
  )
  const settings = useMemo(
    () => (model ? (settingsByModel[model.id] ?? {}) : {}),
    [model, settingsByModel]
  )
  const media = dock.media
  const prompt = dock.prompt

  /* ── URL params: ?model= ?tab= ?preset= ?reuse= ?animate= ?resume= ────── */
  const handledParams = useRef<string | null>(null)
  useEffect(() => {
    if (!hydrated) return
    const key = params.toString()
    if (handledParams.current === key) return
    handledParams.current = key
    const modelParam = params.get("model")
    const tabParam = params.get("tab") as GeneratorTab | null
    const presetParam = params.get("preset")
    const animate = params.get("animate")
    const areaParam = params.get("ambito")
    if (areaParam) chooseArea(areaParam)
    const topicParam = params.get("argomento")
    if (
      areaParam &&
      topicParam &&
      restaurantArea(areaParam)?.topics.includes(topicParam)
    )
      updateRestaurant({ topic: topicParam })
    const purposeParam = params.get("obiettivo")
    if (purposeParam && Object.hasOwn(PURPOSES, purposeParam))
      updateRestaurant({ purpose: purposeParam as keyof typeof PURPOSES })
    const ideaParam = params.get("idea")
    if (ideaParam) setPromptState(surface, ideaParam.slice(0, 3000))
    if (modelParam && findModel(modelParam)?.surface === surface)
      setModelId(surface, modelParam)
    else if (tabParam && tabsFor(surface).includes(tabParam))
      setTab(surface, tabParam)
    if (presetParam) {
      const found = presets.find((item) => item.slug === presetParam)
      if (found && found.surface === surface) {
        if (found.slug.startsWith("risto-")) chooseArea(found.slug.slice(6))
        setModelId(surface, found.modelId)
        setSetting(found.modelId, found.settings)
        setPreset(surface, found.id)
      }
    }
    if (animate && surface === "video") {
      const first = modelsFor("video", "create").find(
        (m) => (m.roles.start ?? 0) > 0
      )
      const target = model && (model.roles.start ?? 0) > 0 ? model : first
      if (target) {
        setModelId("video", target.id)
        setMediaState("video", [
          {
            id: `animate-${Date.now()}`,
            url: animate,
            role: "start",
            kind: "image",
            name: "Start frame",
          },
        ])
      }
    }
    const resume = params.get("resume")
    const cleaned = new URLSearchParams(params)
    for (const name of [
      "model",
      "tab",
      "preset",
      "animate",
      "resume",
      "ambito",
      "argomento",
      "obiettivo",
      "idea",
    ])
      cleaned.delete(name)
    if (cleaned.toString() !== key) {
      const query = cleaned.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    }
    if (resume === "generate" && user) pendingResume.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per distinct query
  }, [hydrated, params])

  /* ── Runs, library ─────────────────────────────────────────────────────── */
  const runs = useRuns({ surface, enabled: Boolean(user) })
  const uploads = useUploads((state) => state.uploads)
  const loadUploads = useUploads((state) => state.load)
  useEffect(() => {
    if (user) void loadUploads()
  }, [loadUploads, user])
  const libraryItems = useMemo(
    () => [
      ...uploads.map(uploadToLibraryItem),
      ...runs.records.flatMap(runToLibraryItems),
    ],
    [runs.records, uploads]
  )

  /* ── Validation and price ──────────────────────────────────────────────── */
  const inputMode = model ? inferInputMode(model, media) : undefined
  const creativePrompt = preset
    ? presetPrompt(preset.promptTemplate, prompt)
    : prompt
  const finalPrompt = restaurantPrompt(restaurantBrief, creativePrompt)
  const validation = useMemo(() => {
    if (!model)
      return { plane: null, path: null, error: "No model is available." }
    try {
      const plane: GenerationPlane = {
        model: model.id,
        inputMode,
        prompt: { text: finalPrompt.trim() },
        media: groupMedia(media),
        settings: parseSettings(model, settings),
      }
      return { plane, path: toPlatform(plane).path, error: null }
    } catch (caught) {
      return {
        plane: null,
        path: null,
        error: caught instanceof Error ? caught.message : String(caught),
      }
    }
  }, [finalPrompt, inputMode, media, model, settings])

  const quote = useMemo(
    () =>
      model
        ? tryPriceFor(model.id, settings, media, pricing.table, finalPrompt)
        : null,
    [finalPrompt, media, model, pricing.table, settings]
  )

  const hasInput = prompt.trim().length > 0 || media.length > 0
  // The endpoint these settings reach has no price (yet) on this deployment.
  const unpriced = Boolean(validation.path && !pricing.table[validation.path])
  const disabledReason = !hasInput
    ? model?.requirePrompt ||
      !model?.roles ||
      Object.keys(model.roles).length === 0
      ? "Descrivi la scena del tuo ristorante."
      : "Aggiungi una descrizione o un riferimento."
    : (validation.error ??
      (unpriced
        ? "This option isn't available yet. Try another model or setting."
        : undefined))
  const canGenerate =
    Boolean(validation.plane) && hasInput && !unpriced && !submitting

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const generate = useCallback(async () => {
    if (!model || !validation.plane) return
    if (!user) {
      openAuth({
        mode: "signup",
        resume: "generate",
        reason: "Accedi per generare: il tuo progetto è salvato.",
      })
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await runs.submit({
      submitKey: newKey(),
      modelId: model.id,
      prompt: creativePrompt,
      restaurant: restaurantBrief,
      acceptedCredits: quote?.credits,
      settings,
      media: media.map((item) => ({
        role: item.role,
        url: item.url,
        ...(item.name ? { name: item.name } : {}),
      })),
      ...(preset ? { presetId: preset.slug } : {}),
    })
    setSubmitting(false)
    if (!result.ok) {
      if (result.code === "INSUFFICIENT_CREDITS") {
        openUpgrade(result.error)
        return
      }
      if (result.code === "UNAUTHORIZED") {
        openAuth({ mode: "login", resume: "generate" })
        return
      }
      setError(result.error)
      return
    }
    if (result.record.status === "failed")
      toast.error("La generazione non è partita", result.record.error)
  }, [
    creativePrompt,
    restaurantBrief,
    quote,
    media,
    model,
    openAuth,
    openUpgrade,
    preset,
    runs,
    settings,
    toast,
    user,
    validation.plane,
  ])

  // Continue the Generate press that required sign-in (dock state was kept).
  useEffect(() => {
    if (!pendingResume.current || !user || !validation.plane || submitting)
      return
    pendingResume.current = false
    toast.info("Riprendo la generazione…")
    void generate()
  }, [generate, submitting, toast, user, validation.plane])

  const setPrompt = useCallback(
    (value: string) => setPromptState(surface, value),
    [setPromptState, surface]
  )
  const setMedia = useCallback(
    (value: MediaItem[]) => setMediaState(surface, value),
    [setMediaState, surface]
  )

  const addMedia = useCallback(
    (role: MediaRole | "auto", selection: AssetSelection[]) => {
      if (!model) return
      const selected = selection.map((item) => ({
        id: item.id,
        url: item.src,
        kind: item.kind,
        ...(item.name ? { name: item.name } : {}),
        ...(item.durationSec ? { durationSec: item.durationSec } : {}),
      }))
      const roles = inputRoles(model, inputMode)
      // The picker surfaces errors itself when it throws.
      const next =
        role === "auto"
          ? mergeReferences(media, selected, roles)
          : mergeMedia(
              media,
              role,
              selected.map((item) => ({ ...item, role })),
              roles[role] ?? model.roles[role] ?? 0
            )
      setError(null)
      setMedia(next)
    },
    [inputMode, media, model, setMedia]
  )

  const removeMedia = useCallback(
    (id: string) => {
      setError(null)
      setMedia(media.filter((item) => item.id !== id))
    },
    [media, setMedia]
  )

  const changeRole = useCallback(
    (id: string, role: "reference" | "start" | "end") => {
      if (!model) return
      try {
        setMedia(changeImageRole(model, media, id, role))
        setError(null)
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not change the image role."
        )
      }
    },
    [media, model, setMedia]
  )

  const upload = useCallback(
    async (file: File) => {
      if (!user) {
        openAuth({
          mode: "signup",
          reason: "Create a free account to upload references.",
        })
        throw new Error("Sign in to upload files.")
      }
      return uploadAsset(file)
    },
    [openAuth, user]
  )

  const chooseModel = useCallback(
    (id: string) => {
      setError(null)
      setModelId(surface, id)
      if (preset && preset.modelId !== id) setPreset(surface, undefined)
    },
    [preset, setModelId, setPreset, surface]
  )

  const reuse = useCallback(
    (run: GenerationView) => {
      const target = findModel(run.modelId)
      if (!target) return
      if (target.surface !== surface) {
        router.push(`/${target.surface}?model=${target.id}`)
        return
      }
      setModelId(surface, target.id)
      setSetting(target.id, run.settings)
      setPromptState(surface, run.prompt)
      if (run.restaurant) updateRestaurant(run.restaurant)
      setPreset(surface, undefined)
      setMediaState(
        surface,
        run.media.map((item, index) => ({
          id: `reuse-${run.id}-${index}`,
          url: item.url,
          role: item.role,
          kind: item.kind,
          ...(item.name ? { name: item.name } : {}),
        }))
      )
      toast.info("Progetto e impostazioni ripristinati")
    },
    [
      router,
      setMediaState,
      setModelId,
      setPreset,
      setPromptState,
      setSetting,
      surface,
      toast,
      updateRestaurant,
    ]
  )

  return {
    euroQuote:
      quote && pricing.euro
        ? {
            amount: quote.credits * pricing.euro.eurPerCredit,
            date: pricing.euro.date,
          }
        : null,
    restaurantBrief,
    brandKit,
    updateRestaurant,
    chooseArea,
    setBrandKit,
    applyBrandKit,
    surface,
    tab,
    tabs,
    setTab: (next: GeneratorTab) => setTab(surface, next),
    model,
    models,
    allModels,
    chooseModel,
    settings,
    setSetting: (key: string, value: unknown) =>
      model && setSetting(model.id, { [key]: value }),
    prompt,
    setPrompt,
    media,
    addMedia,
    removeMedia,
    changeRole,
    clearMedia: () => setMedia([]),
    inputMode,
    preset,
    clearPreset: () => setPreset(surface, undefined),
    choosePreset: (item: PresetView) => {
      setModelId(surface, item.modelId)
      setSetting(item.modelId, item.settings)
      setPreset(surface, item.id)
    },
    library: { items: libraryItems, onUpload: upload },
    quote,
    canGenerate,
    disabledReason,
    generate,
    submitting,
    error: error ?? runs.error,
    clearError: () => {
      setError(null)
      runs.setError(null)
    },
    runs,
    reuse,
    hydrated,
    getModel,
  }
}
