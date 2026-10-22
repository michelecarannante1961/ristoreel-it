import "server-only"

import type { ObjectId } from "mongodb"

import type {
  MediaItem,
  MediaKind,
  MediaRole,
} from "@/generation/catalog/types"
import { UserFacingError } from "@/lib/errors"
import { collections, type GenerationOutput } from "@/lib/db/collections"
import { env } from "@/lib/env"

/**
 * Attachments arrive from the browser as display URLs. Each one must belong to
 * the signed-in user (an upload, an output of their own generation, or one of
 * the built-in RistoReel restaurant stock assets); we swap in the URL the
 * platform can fetch and the server-probed duration.
 */
export type ClientMedia = { role: MediaRole; url: string; name?: string }

export type ResolvedMedia = MediaItem & {
  kind: MediaKind
  /** What the generation document stores (display URL). */
  displayUrl: string
}

const BUILTIN_STOCK_PATH =
  /^\/media\/ristorazione\/(ambito-[0-9]{2}\.(jpg|mp4)|chef-regia\.mp4|chef-pasta-audio\.mp4|chef-pasta-muto\.mp4|piatto\.jpg|cucina\.jpg|sala\.jpg|vino\.jpg|ingredienti\.jpg)$/

function resolveBuiltinStock(rawUrl: string): {
  pathname: string
  publicUrl: string
  kind: MediaKind
} | null {
  let pathname = rawUrl
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      pathname = new URL(rawUrl).pathname
    } catch {
      return null
    }
  }
  if (!BUILTIN_STOCK_PATH.test(pathname)) return null
  const origin = env().APP_URL.replace(/\/$/, "")
  const publicOrigin =
    origin.includes("localhost") || origin.includes("127.0.0.1")
      ? "https://ristoreel.it"
      : origin
  return {
    pathname,
    publicUrl: `${publicOrigin}${pathname}`,
    kind: pathname.endsWith(".mp4") ? "video" : "image",
  }
}

/** URL the platform should fetch for an output. */
export function fetchableOutputUrl(output: GenerationOutput): string {
  return output.storage === "r2"
    ? output.url
    : (output.platformUrl ?? output.url)
}

export async function resolveOwnedMedia(
  userId: ObjectId,
  items: ClientMedia[]
): Promise<ResolvedMedia[]> {
  if (!items.length) return []
  const { uploads, generations } = await collections()
  const urls = [...new Set(items.map((item) => item.url))]
  const [ownUploads, ownGenerations] = await Promise.all([
    uploads
      .find({
        userId,
        $or: [{ url: { $in: urls } }, { platformUrl: { $in: urls } }],
      })
      .toArray(),
    generations
      .find(
        { userId, "outputs.url": { $in: urls } },
        { projection: { outputs: 1 } }
      )
      .toArray(),
  ])
  return items.map((item, index) => {
    const builtin = resolveBuiltinStock(item.url)
    if (builtin) {
      return {
        id: `m${index}`,
        role: item.role,
        kind: builtin.kind,
        url: builtin.publicUrl,
        displayUrl: builtin.pathname,
        ...(item.name ? { name: item.name } : {}),
        ...(builtin.kind === "video" ? { durationSec: 5 } : {}),
      }
    }
    const upload = ownUploads.find(
      (doc) => doc.url === item.url || doc.platformUrl === item.url
    )
    if (upload)
      return {
        id: `m${index}`,
        role: item.role,
        kind: upload.kind,
        url: upload.url,
        displayUrl: upload.url,
        name: item.name ?? upload.name,
        ...(upload.durationSec ? { durationSec: upload.durationSec } : {}),
      }
    const output = ownGenerations
      .flatMap((doc) => doc.outputs)
      .find((candidate) => candidate.url === item.url)
    if (output)
      return {
        id: `m${index}`,
        role: item.role,
        kind: output.kind,
        url: fetchableOutputUrl(output),
        displayUrl: output.url,
        ...(item.name ? { name: item.name } : {}),
        ...(output.durationSec ? { durationSec: output.durationSec } : {}),
      }
    throw new UserFacingError(
      "Uno degli allegati non è più disponibile. Rimuovilo e caricalo di nuovo.",
      "MEDIA_NOT_FOUND"
    )
  })
}
