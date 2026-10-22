"use client"
import Link from "next/link"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { useApp } from "@/components/providers/app-providers"
export function UpgradeModal() {
  const { upgrade, closeUpgrade, credits } = useApp()
  return (
    <DialogPrimitive.Root
      open={upgrade.open}
      onOpenChange={(open) => !open && closeUpgrade()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-panel p-7">
          <DialogPrimitive.Close
            aria-label="Chiudi"
            className="absolute top-5 right-5"
          >
            <X size={18} />
          </DialogPrimitive.Close>
          <DialogPrimitive.Title className="pr-6 text-2xl font-semibold">
            I tuoi crediti
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-4 text-sm leading-6 text-muted-foreground">
            {upgrade.reason ??
              "Il prezzo di ogni creazione è indicato nello studio, prima della generazione."}
          </DialogPrimitive.Description>
          <p className="my-6 text-3xl text-lime">
            {credits ?? 0} <span className="text-sm">crediti disponibili</span>
          </p>
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
            <p className="mb-6 text-sm leading-6 text-muted-foreground">
              Questa anteprima usa crediti di prova. Non sono disponibili
              acquisti o addebiti reali.
            </p>
          ) : (
            <p className="mb-6 text-sm leading-6 text-muted-foreground">
              Le ricariche sono disponibili quando il sistema di pagamento è
              configurato.
            </p>
          )}
          <Link
            href="/pricing"
            onClick={closeUpgrade}
            className="risto-primary"
          >
            Come funziona il prezzo
          </Link>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
