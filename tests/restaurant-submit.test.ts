import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  balanceOf,
  clearDatabase,
  createUser,
  installFakeHiggsfield,
  setupEnv,
  startDatabase,
  stopDatabase,
  type FakeHiggsfield,
} from "./support/harness"
import { DEFAULT_BRIEF } from "@/lib/restaurant/brief"

setupEnv()
process.env.RESTAURANT_MODE = "true"
process.env.CREDIT_MARKUP = "1.5"

const { submitGeneration } = await import("@/lib/generations/submit")
const { collections } = await import("@/lib/db/collections")
const { ObjectId } = await import("mongodb")
const { creditConfig } = await import("@/lib/billing/config")
const { invalidatePricing } = await import("@/lib/billing/pricing")
const { resetEnvForTests } = await import("@/lib/env")
const { createHiggsfieldClient, setHiggsfieldClientForTests } =
  await import("@/lib/higgsfield/client")

beforeAll(startDatabase, 120_000)
afterAll(stopDatabase)
let fake: FakeHiggsfield
beforeEach(async () => {
  process.env.HF_API_BASE_URL = "https://hf.test"
  process.env.HF_PRICE_GUARD = "false"
  resetEnvForTests()
  invalidatePricing()
  await clearDatabase()
  fake = await installFakeHiggsfield()
})

const input = () => ({
  submitKey: randomUUID(),
  modelId: "soul-2",
  prompt: "Lo chef presenta il nostro risotto ai funghi.",
  settings: { batchSize: "1", resolution: "720p" },
  media: [],
  restaurant: DEFAULT_BRIEF,
  acceptedCredits: 14,
})

describe("restaurant generation boundary", () => {
  it("requires a restaurant brief before charging or calling Higgsfield", async () => {
    const user = await createUser({ topup: 100 })
    const { restaurant: omitted, ...raw } = input()
    expect(omitted).toBeDefined()
    await expect(submitGeneration(user, raw)).rejects.toThrow(/ambito/)
    expect(await balanceOf(user.objectId)).toEqual({
      subscription: 0,
      topup: 100,
    })
    expect(fake.submits).toHaveLength(0)
  })
  it("rejects a changed quote before debiting credits", async () => {
    const user = await createUser({ topup: 100 })
    await expect(
      submitGeneration(user, { ...input(), acceptedCredits: 1 })
    ).rejects.toThrow(/preventivo/)
    expect(await balanceOf(user.objectId)).toEqual({
      subscription: 0,
      topup: 100,
    })
    expect(fake.submits).toHaveLength(0)
  })
  it("rejects off-topic non-restaurant prompts on the server before debiting credits", async () => {
    const user = await createUser({ topup: 100 })
    await expect(
      submitGeneration(user, {
        ...input(),
        prompt: "Come fare trading finanziario con bitcoin e criptovalute",
      })
    ).rejects.toThrow(/esclusivamente alla ristorazione/)
    expect(await balanceOf(user.objectId)).toEqual({
      subscription: 0,
      topup: 100,
    })
    expect(fake.submits).toHaveLength(0)
  })
  it("uses 1.5 on the server, saves the brief, and preserves reuse without duplicated prefixes", async () => {
    const user = await createUser({ topup: 100 })
    expect(creditConfig().markup).toBe(1.5)
    const raw = input()
    const view = await submitGeneration(user, raw)
    expect(view.cost).toBe(14)
    expect(view.restaurant).toEqual(DEFAULT_BRIEF)
    expect(view.prompt).toBe(raw.prompt)
    expect(fake.submits[0]!.body.prompt).toContain(
      "esclusivamente alla ristorazione"
    )
    const { generations } = await collections()
    const stored = await generations.findOne({ _id: new ObjectId(view.id) })
    expect(stored!.priceUsd).toBeCloseTo(0.09)
    expect(stored!.sourcePrompt).toBe(raw.prompt)
    expect(await balanceOf(user.objectId)).toEqual({
      subscription: 0,
      topup: 86,
    })
    await submitGeneration(user, raw)
    expect(fake.submits).toHaveLength(1)
  })

  async function liveEstimate(usd: number | null) {
    const { PRICING_TABLE } = await import("@/lib/billing/pricing-table")
    const { modelPricing } = await collections()
    const path = "higgsfield-ai/soul/v2/standard"
    await modelPricing.insertOne({
      _id: new ObjectId(),
      modelId: "soul-2",
      enabled: true,
      rules: { [path]: { ...PRICING_TABLE[path]!, source: "admin" } },
      updatedAt: new Date(),
    })
    process.env.HF_API_BASE_URL = "https://api.higgsfield.ai"
    process.env.HF_PRICE_GUARD = "true"
    resetEnvForTests()
    invalidatePricing()
    setHiggsfieldClientForTests(
      createHiggsfieldClient({
        credentials: "key:secret",
        baseUrl: "https://hf.test",
        sleep: async () => undefined,
        fetch: async (url, options) => {
          if (String(url).includes("/estimate/")) {
            if (usd === null) throw new Error("Supplier unavailable")
            return new Response(JSON.stringify({ usd, credits: 1 }), {
              headers: { "content-type": "application/json" },
            })
          }
          return fake.fetch(url, options)
        },
      })
    )
  }

  it.each([0.1, 0.08])(
    "blocks a changed live price (%s) without charging",
    async (usd) => {
      await liveEstimate(usd)
      const user = await createUser({ topup: 100 })
      await expect(submitGeneration(user, input())).rejects.toThrow(
        /costo del modello è cambiato/
      )
      expect(await balanceOf(user.objectId)).toEqual({
        subscription: 0,
        topup: 100,
      })
      expect(fake.submits).toHaveLength(0)
    }
  )
  it("fails closed when the supplier estimate is unavailable", async () => {
    await liveEstimate(null)
    const user = await createUser({ topup: 100 })
    await expect(submitGeneration(user, input())).rejects.toThrow(
      /verificare il costo/
    )
    expect(await balanceOf(user.objectId)).toEqual({
      subscription: 0,
      topup: 100,
    })
    expect(fake.submits).toHaveLength(0)
  })
})
