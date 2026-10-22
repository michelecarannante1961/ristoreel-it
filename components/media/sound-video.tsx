"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { cn } from "@/lib/utils"

const AUDIO_EVENT = "ristoreel:unmute"

/**
 * Video in autoplay silenzioso (obbligatorio per i browser) con pulsante
 * interattivo "Audio / Muto" per ascoltare la traccia audio quando si desidera.
 * Se l'utente attiva l'audio su un video, gli altri si silenziano automaticamente.
 */
export function SoundVideo({
  src,
  poster,
  label,
  className,
  buttonClassName,
  compact = false,
}: {
  src: string
  poster?: string
  label?: string
  className?: string
  buttonClassName?: string
  compact?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = muted
  }, [muted])

  useEffect(() => {
    const onOtherUnmute = (event: Event) => {
      const custom = event as CustomEvent<{ src: string; el: HTMLVideoElement | null }>
      if (custom.detail?.el !== ref.current) {
        setMuted(true)
        if (ref.current) ref.current.muted = true
      }
    }
    window.addEventListener(AUDIO_EVENT, onOtherUnmute)
    return () => window.removeEventListener(AUDIO_EVENT, onOtherUnmute)
  }, [])

  const toggleSound = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const video = ref.current
    if (!video) return
    const nextMuted = !muted
    if (!nextMuted) {
      window.dispatchEvent(
        new CustomEvent(AUDIO_EVENT, { detail: { src, el: video } })
      )
      video.muted = false
      void video.play().catch(() => undefined)
    } else {
      video.muted = true
    }
    setMuted(nextMuted)
  }

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        className={className}
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Attiva audio del video" : "Disattiva audio del video"}
        title={muted ? "Clicca per ascoltare l'audio" : "Disattiva audio"}
        className={cn(
          "z-20 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#171615]/80 text-white backdrop-blur-md transition-all hover:border-[#e8a276] hover:bg-[#171615]",
          compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
          !muted && "border-[#e8a276] bg-[#e8a276] text-[#201a17] font-semibold",
          buttonClassName
        )}
      >
        {muted ? (
          <>
            <VolumeX className={compact ? "size-3" : "size-3.5"} />
            <span>Audio</span>
          </>
        ) : (
          <>
            <Volume2 className={compact ? "size-3" : "size-3.5"} />
            <span>Attivo</span>
          </>
        )}
      </button>
    </>
  )
}
