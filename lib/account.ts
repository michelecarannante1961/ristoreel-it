import "server-only"

import { ObjectId, type Filter } from "mongodb"

import { NotFoundError } from "@/lib/errors"
import { totalCredits } from "@/lib/billing/ledger"
import { planOf, type BillingInterval, type PlanId } from "@/lib/billing/plans"
import { billingEnabled } from "@/lib/billing/stripe"
import {
  DEFAULT_BRAND_KIT,
  restaurantBrandKitSchema,
  type RestaurantBrandKit,
} from "@/lib/restaurant/brand-kit"
import {
  collections,
  type Credits,
  type LedgerDoc,
  type LedgerReason,
} from "@/lib/db/collections"

export interface AccountView {
  email: string
  name?: string | null
  image?: string | null
  role: "user" | "admin"
  plan: PlanId
  planName: string
  planInterval?: BillingInterval
  planStatus?: string
  planRenewsAt?: number
  credits: Credits
  total: number
  hasBillingAccount: boolean
  billingEnabled: boolean
  brandKit: RestaurantBrandKit
  createdAt: number
}

export async function getAccount(userId: ObjectId): Promise<AccountView> {
  const { users } = await collections()
  const user = await users.findOne({ _id: userId })
  if (!user) throw new NotFoundError("Account not found.")
  const credits = user.credits ?? { subscription: 0, topup: 0 }
  const plan = planOf(user.plan)
  return {
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role ?? "user",
    plan: plan.id,
    planName: plan.name,
    ...(user.planInterval ? { planInterval: user.planInterval } : {}),
    ...(user.planStatus ? { planStatus: user.planStatus } : {}),
    ...(user.planRenewsAt ? { planRenewsAt: user.planRenewsAt.getTime() } : {}),
    credits,
    total: totalCredits(credits),
    hasBillingAccount: Boolean(user.stripeCustomerId),
    billingEnabled: billingEnabled(),
    brandKit: user.brandKit ?? DEFAULT_BRAND_KIT,
    createdAt: user.createdAt?.getTime() ?? 0,
  }
}

export async function saveBrandKit(
  userId: ObjectId,
  raw: unknown
): Promise<RestaurantBrandKit> {
  const brandKit = restaurantBrandKitSchema.parse(raw)
  const { users } = await collections()
  await users.updateOne({ _id: userId }, { $set: { brandKit } })
  return brandKit
}

/** Live balance for the nav pill (never cached in the session). */
export async function getBalance(
  userId: ObjectId
): Promise<{ total: number; credits: Credits }> {
  const { users } = await collections()
  const user = await users.findOne(
    { _id: userId },
    { projection: { credits: 1 } }
  )
  const credits = user?.credits ?? { subscription: 0, topup: 0 }
  return { total: totalCredits(credits), credits }
}

export interface LedgerEntryView {
  id: string
  delta: number
  bucket: "subscription" | "topup"
  reason: LedgerReason
  label: string
  refType: string
  refId: string
  note?: string
  balanceAfter: number
  createdAt: number
}

const REASON_LABEL: Record<LedgerReason, string> = {
  generation_debit: "Generazione video/immagine",
  generation_refund: "Rimborso automatico",
  generation_adjust: "Conguaglio crediti",
  subscription_grant: "Crediti piano mensile",
  subscription_reset: "Rinnovo piano mensile",
  topup_purchase: "Ricarica crediti",
  signup_bonus: "Bonus di benvenuto",
  admin_adjust: "Rettifica assistenza",
  stripe_refund: "Pagamento rimborsato",
}

export function toLedgerView(doc: LedgerDoc): LedgerEntryView {
  return {
    id: doc._id.toHexString(),
    delta: doc.delta,
    bucket: doc.bucket,
    reason: doc.reason,
    label: REASON_LABEL[doc.reason],
    refType: doc.refType,
    refId: doc.refId,
    ...(doc.note ? { note: doc.note } : {}),
    balanceAfter: totalCredits(doc.balanceAfter),
    createdAt: doc.createdAt.getTime(),
  }
}

export async function listLedger(
  userId: ObjectId,
  cursor?: string,
  limit = 50
): Promise<{ items: LedgerEntryView[]; nextCursor: string | null }> {
  const { ledger } = await collections()
  const filter: Filter<LedgerDoc> = { userId }
  if (cursor && ObjectId.isValid(cursor))
    filter._id = { $lt: new ObjectId(cursor) }
  const docs = await ledger
    .find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .toArray()
  const page = docs.slice(0, limit)
  return {
    items: page.map(toLedgerView),
    nextCursor:
      docs.length > limit ? (page.at(-1)?._id.toHexString() ?? null) : null,
  }
}
