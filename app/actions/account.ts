"use server"

import {
  listLedger,
  saveBrandKit,
  type LedgerEntryView,
} from "@/lib/account"
import { runAction } from "@/lib/action-result"
import type { ActionResult } from "@/lib/action-types"
import { requireUser } from "@/lib/auth/session"
import type { RestaurantBrandKit } from "@/lib/restaurant/brand-kit"

export async function loadLedgerAction(
  cursor: string
): Promise<
  ActionResult<{ items: LedgerEntryView[]; nextCursor: string | null }>
> {
  return runAction(async () =>
    listLedger((await requireUser()).objectId, cursor)
  )
}

export async function saveBrandKitAction(
  raw: unknown
): Promise<ActionResult<RestaurantBrandKit>> {
  return runAction(async () =>
    saveBrandKit((await requireUser()).objectId, raw)
  )
}
