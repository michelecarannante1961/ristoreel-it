"use client"

import { useMemo, useRef, useState } from "react"
import type { DragEvent, ReactElement } from "react"
import {
  AtSign,
  AudioLines,
  Check,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  Search,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FREE_PHOTO_SITES, RESTAURANT_STOCK_LIBRARY } from "@/lib/showcase"
import { kindOf } from "@/lib/studio/uploads"
import type {
  AssetKind,
  AssetLibraryItem,
  AssetSelection,
} from "@/lib/studio/uploads"
import { cn } from "@/lib/utils"

type Tab = "stock" | "uploads" | AssetKind | "free"

const FILE_ACCEPT: Record<AssetKind, string> = {
  image: "image/jpeg,image/jpg,image/png,image/webp,image/gif",
  video: "video/mp4",
  audio: "audio/wav,audio/x-wav,.wav",
}

const TABS: { value: Tab; label: string }[] = [
  { value: "stock", label: "Catalogo Ristorante (20)" },
  { value: "uploads", label: "Caricati dal PC" },
  { value: "image", label: "Immagini" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "free", label: "Siti Foto Gratis 🌐" },
]

export type AssetLibraryModalProps = {
  trigger: ReactElement
  items: AssetLibraryItem[]
  onUpload: (file: File) => Promise<AssetSelection>
  maxSelections?: number
  kindLimits?: Partial<Record<AssetKind, number>>
  excludeIds?: string[]
  /** Restrict what can be picked (e.g. a start frame is image-only). */
  accept?: AssetKind[]
  defaultOpen?: boolean
} & (
  | { onSelect: (selection: AssetSelection) => void; onSelectMany?: never }
  | { onSelectMany: (selection: AssetSelection[]) => void; onSelect?: never }
)

export function AssetLibraryModal({
  trigger,
  items,
  onUpload,
  onSelect,
  onSelectMany,
  maxSelections = 1,
  kindLimits,
  excludeIds = [],
  accept,
  defaultOpen,
}: AssetLibraryModalProps) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const [tab, setTab] = useState<Tab>("stock")
  const [query, setQuery] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<AssetSelection[]>([])
  const multiple = onSelectMany !== undefined
  const inputRef = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => {
    if (tab === "free") return []
    const q = query.trim().toLowerCase()
    const sourceList =
      tab === "stock" ? RESTAURANT_STOCK_LIBRARY : items
    return sourceList.filter((item) => {
      if (accept && !accept.includes(item.kind)) return false
      if (excludeIds.includes(item.src)) return false
      if (tab === "uploads" && item.source !== "upload") return false
      if (
        (tab === "image" || tab === "video" || tab === "audio") &&
        item.kind !== tab
      )
        return false
      return q === "" || (item.name ?? "").toLowerCase().includes(q)
    })
  }, [accept, excludeIds, items, query, tab])

  const changeOpen = (next: boolean) => {
    if (uploading) return
    setOpen(next)
    if (next) {
      setSelected([])
      setError(null)
      setQuery("")
      setTab("stock")
    }
  }

  const commit = (selection: AssetSelection[]) => {
    try {
      if (onSelectMany) onSelectMany(selection)
      else if (selection[0]) onSelect(selection[0])
      setOpen(false)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossibile allegare questo file."
      )
    }
  }

  const canPick = (kind: AssetKind) =>
    selected.length < maxSelections &&
    selected.filter((item) => item.kind === kind).length <
      (kindLimits?.[kind] ?? maxSelections)

  const pick = (selection: AssetSelection) => {
    setError(null)
    if (!multiple) {
      commit([selection])
      return
    }
    if (selected.some((item) => item.src === selection.src)) {
      setSelected((current) =>
        current.filter((item) => item.src !== selection.src)
      )
    } else if (canPick(selection.kind)) {
      setSelected((current) => [...current, selection])
    } else {
      setError(`Puoi aggiungere al massimo ${maxSelections} file.`)
    }
  }

  const upload = async (files: File[]) => {
    if (!files.length || uploading) return
    setError(null)
    try {
      const remaining = multiple ? maxSelections - selected.length : 1
      if (files.length > remaining)
        throw new Error(`Puoi scegliere al massimo ${remaining} file.`)
      const pending = selected.map((item) => item.kind)
      for (const file of files) {
        const kind = kindOf(file)
        if (accept && !accept.includes(kind))
          throw new Error(`Qui puoi caricare solo file di tipo: ${accept.join(" o ")}.`)
        pending.push(kind)
        if (
          pending.filter((value) => value === kind).length >
          (kindLimits?.[kind] ?? maxSelections)
        )
          throw new Error(
            `Puoi aggiungere al massimo ${kindLimits?.[kind] ?? maxSelections} file.`
          )
      }
      setUploading(true)
      for (const file of files) {
        const uploaded = await onUpload(file)
        if (multiple)
          setSelected((current) =>
            current.some((item) => item.src === uploaded.src)
              ? current
              : [...current, uploaded]
          )
        else commit([uploaded])
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Caricamento non riuscito — riprova."
      )
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    void upload(Array.from(event.dataTransfer.files))
  }

  const acceptAttr = (accept ?? (["image", "video", "audio"] as AssetKind[]))
    .map((kind) => FILE_ACCEPT[kind])
    .join(",")
  const canUploadHere = tab === "uploads" || tab === "stock"

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent size="xl">
        <DialogTitle className="sr-only">Libreria materiali e foto</DialogTitle>
        <DialogDescription className="sr-only">
          Carica una foto dal tuo PC, scegli dal catalogo ristorazione o scarica foto gratuite.
        </DialogDescription>
        <div className="q-modal-header q-modal-header-flush px-2 py-1">
          <Tabs
            variant="pill"
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="flex-1"
          >
            <TabsList>
              {TABS.filter(
                (item) =>
                  item.value === "stock" ||
                  item.value === "uploads" ||
                  item.value === "free" ||
                  !accept ||
                  accept.includes(item.value as AssetKind)
              ).map((t) => (
                <TabsTrigger key={t.value} value={t.value} disabled={uploading}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <DialogCloseButton disabled={uploading} />
        </div>

        <DialogBody>
          <div className="flex h-[595px] flex-col gap-px overflow-clip rounded-q-400">
            <div className="flex shrink-0 flex-wrap items-center gap-2 bg-q-transparent-light-05 p-2">
              <div className="flex flex-1 items-center gap-2 px-1 text-q-caption-sm-medium text-q-text-secondary">
                {tab === "free"
                  ? "Banche immagini gratuite per la ristorazione"
                  : `${visible.length} ${visible.length === 1 ? "elemento disponibile" : "elementi disponibili"}`}
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#e8a276] px-3 text-xs font-semibold text-[#201a17] transition hover:brightness-110 disabled:opacity-50"
              >
                <Upload className="size-3.5" />
                {uploading ? "Caricamento…" : "Carica dal tuo PC"}
              </button>
              {tab !== "free" ? (
                <div className="flex w-48 items-center">
                  <Input
                    aria-label="Cerca nella libreria"
                    placeholder="Cerca foto…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    start={<Search />}
                  />
                </div>
              ) : null}
            </div>
            {error != null ? (
              <div className="shrink-0 bg-q-transparent-light-05 px-3 py-2">
                <p
                  className="text-q-caption-sm-regular text-q-state-error-fg"
                  role="alert"
                >
                  {error}
                </p>
              </div>
            ) : null}
            <div
              className={cn(
                "relative min-h-0 flex-1 overflow-y-auto bg-q-transparent-light-05 p-2",
                dragging && "ring-2 ring-q-border-focus ring-inset"
              )}
              onDragOver={(e) => {
                e.preventDefault()
                if (canUploadHere) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                if (canUploadHere) onDrop(event)
              }}
            >
              {tab === "free" ? (
                <div className="flex flex-col gap-4 p-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-base font-semibold text-white">
                      Arricchisci la tua libreria con foto gratuite professionali
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-white/70">
                      Clicca su uno dei portali gratuiti qui sotto (si aprono in una nuova scheda),
                      scarica sul tuo PC la foto del piatto o della sala che preferisci e poi clicca su{" "}
                      <strong className="text-[#e8a276]">“Carica dal tuo PC”</strong> in alto a destra.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {FREE_PHOTO_SITES.map((site) => (
                      <a
                        key={site.name}
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#e8a276] hover:bg-white/[0.06]"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-[#e8a276]">
                              {site.name}
                            </span>
                            <ExternalLink className="size-4 text-white/60 group-hover:text-[#e8a276]" />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-white/70">
                            {site.description}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#e8a276]">
                          Apri catalogo gratuito →
                        </span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e8a276] px-5 text-sm font-semibold text-[#201a17] transition hover:brightness-110"
                    >
                      <Upload className="size-4" />
                      Hai scaricato una foto? Caricala ora dal tuo PC
                    </button>
                  </div>
                </div>
              ) : visible.length === 0 ? (
                <EmptyState
                  tab={tab}
                  uploading={uploading}
                  onUpload={
                    canUploadHere ? () => inputRef.current?.click() : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-3 gap-[3px] sm:grid-cols-4 lg:grid-cols-5">
                  {canUploadHere ? (
                    <UploadCard
                      uploading={uploading}
                      onClick={() => inputRef.current?.click()}
                    />
                  ) : null}
                  {visible.map((item) => (
                    <ElementCard
                      key={item.id}
                      item={item}
                      onSelect={pick}
                      selected={selected.some(
                        (selection) => selection.src === item.src
                      )}
                      selectable={multiple}
                      disabled={
                        uploading ||
                        (multiple &&
                          !canPick(item.kind) &&
                          !selected.some(
                            (selection) => selection.src === item.src
                          ))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        {multiple ? (
          <DialogFooter
            caption={
              selected.length
                ? `${selected.length} selezionati`
                : "Scegli i riferimenti"
            }
          >
            <Button
              variant="ghost"
              disabled={uploading}
              onClick={() => setSelected([])}
            >
              Azzera
            </Button>
            <Button
              disabled={uploading || selected.length === 0}
              onClick={() => commit(selected)}
            >
              Aggiungi {selected.length || "riferimenti"}
            </Button>
          </DialogFooter>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptAttr}
          multiple={multiple}
          disabled={uploading}
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function UploadCard({
  uploading,
  onClick,
}: {
  uploading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={uploading}
      onClick={onClick}
      className="flex h-[148px] w-full flex-col items-center gap-1.5 rounded-q-400 p-1 text-left disabled:opacity-60"
    >
      <div className="flex h-24 w-full items-center justify-center rounded-q-300 border border-dashed border-[#e8a276]/50 bg-[#e8a276]/10">
        <span className="flex size-10 items-center justify-center rounded-q-full bg-[#e8a276] text-[#201a17] shadow-q-raised-sm">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Plus className="size-5" />
          )}
        </span>
      </div>
      <div className="px-1 py-0.5">
        <span className="text-q-caption-sm-semi-bold text-[#e8a276]">
          {uploading ? "Caricamento…" : "Carica dal PC"}
        </span>
      </div>
    </button>
  )
}

function ElementCard({
  item,
  onSelect,
  selected,
  selectable,
  disabled,
}: {
  item: AssetLibraryItem
  onSelect: (selection: AssetSelection) => void
  selected: boolean
  selectable: boolean
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${selectable ? "Seleziona" : "Usa"} ${item.name ?? item.kind}`}
      aria-pressed={selectable ? selected : undefined}
      disabled={disabled}
      className={cn(
        "flex h-[148px] w-full flex-col gap-1.5 rounded-q-400 p-1 text-left transition-colors hover:bg-q-transparent-light-05 focus-visible:ring-2 focus-visible:ring-q-border-focus focus-visible:outline-none disabled:opacity-40",
        selected && "bg-q-transparent-light-10 ring-1 ring-q-border-focus"
      )}
    >
      <span className="relative block h-24 w-full overflow-hidden rounded-q-300 bg-q-background-tertiary">
        {item.kind === "audio" ? (
          <span
            className="flex size-full items-center justify-center"
            role="img"
            aria-label="Audio"
          >
            <AudioLines className="size-8 text-q-icon-secondary" />
          </span>
        ) : item.kind === "video" ? (
          <video
            src={item.src}
            muted
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt={item.name ?? ""}
            className="size-full object-cover"
            loading="lazy"
          />
        )}
        {selected ? (
          <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" />
          </span>
        ) : null}
        {item.kind === "video" ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex size-5 items-center justify-center rounded-full bg-q-overlay-scrim text-q-text-primary">
            <Play className="size-3" fill="currentColor" />
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 px-1 py-0.5">
        <span className="truncate text-q-caption-sm-semi-bold text-q-text-primary">
          {item.name ?? item.kind}
        </span>
        <span className="truncate text-q-caption-sm-regular text-q-text-secondary">
          {item.id.startsWith("stock-")
            ? "Catalogo Ristorante"
            : item.source === "upload"
              ? "Caricato dal PC"
              : "Generato"}
        </span>
      </span>
    </button>
  )
}

function EmptyState({
  tab,
  uploading,
  onUpload,
}: {
  tab: Tab
  uploading: boolean
  onUpload?: () => void
}) {
  const content = (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-q-300 border border-q-border-subtle bg-q-transparent-light-05 shadow-q-raised">
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-q-transparent-light-20 via-q-transparent-light-05 to-transparent mix-blend-overlay"
        />
        {uploading ? (
          <Loader2 className="relative size-5 animate-spin text-q-icon-secondary" />
        ) : (
          <AtSign className="relative size-5 text-q-icon-secondary" />
        )}
      </span>
      <span className="flex flex-col items-center gap-1.5">
        <span className="text-q-label-md-semi-bold text-q-text-primary">
          {tab === "uploads" ? "Nessun file ancora caricato dal PC" : "Nessun elemento in questa scheda"}
        </span>
        <span className="max-w-[280px] text-q-caption-sm-medium text-q-text-secondary">
          {tab === "uploads"
            ? "Clicca qui o su “Carica dal tuo PC” per scegliere una foto o un video dal tuo computer"
            : "Usa la scheda “Catalogo Ristorante (20)” oppure carica un file dal tuo PC"}
        </span>
      </span>
    </div>
  )
  return onUpload ? (
    <button
      type="button"
      disabled={uploading}
      aria-label="Carica dal tuo PC"
      className="flex size-full items-center justify-center disabled:opacity-60"
      onClick={onUpload}
    >
      {content}
    </button>
  ) : (
    <div className="flex size-full items-center justify-center">{content}</div>
  )
}
