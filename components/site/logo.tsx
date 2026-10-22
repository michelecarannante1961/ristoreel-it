import Link from "next/link"

import { BRAND } from "@/lib/brand"
import { cn } from "@/lib/utils"

/** Vireo mark: a lime tile with a wing-shaped V. Placeholder wordmark until brand assets arrive. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="#E8A276" />
      <path
        d="M10 8v7m4-7v7m-6-3h8m-4 3v9m9-16v16m0-16c-5 3-5 10 0 10"
        stroke="#201A17"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND.name} home`}
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <LogoMark className={compact ? "size-6" : "size-8"} />
      <span
        className={cn(
          "font-display text-foreground",
          compact ? "text-base" : "text-lg"
        )}
      >
        {BRAND.name}
      </span>
    </Link>
  )
}
