import { describe, expect, it } from "vitest"

import { creditsFromUsd } from "@/lib/billing/price"
import {
  DEFAULT_BRIEF,
  isOffTopicRestaurantPrompt,
  restaurantBriefSchema,
  restaurantPrompt,
} from "@/lib/restaurant/brief"
import { restaurantBrandKitSchema } from "@/lib/restaurant/brand-kit"
import { RESTAURANT_AREAS } from "@/lib/restaurant/catalog"
import { RESTAURANT_MARKUP } from "@/lib/restaurant/policy"
import { buildRestaurantStoryboard } from "@/lib/restaurant/storyboard"

describe("restaurant specialization", () => {
  it("retains all 20 areas and 161 original topics", () => {
    expect(RESTAURANT_AREAS).toHaveLength(20)
    expect(new Set(RESTAURANT_AREAS.map((area) => area.id)).size).toBe(20)
    expect(
      RESTAURANT_AREAS.reduce((sum, area) => sum + area.topics.length, 0)
    ).toBe(161)
    for (const area of RESTAURANT_AREAS)
      for (const topic of area.topics)
        expect(
          restaurantBriefSchema.safeParse({
            ...DEFAULT_BRIEF,
            areaId: area.id,
            topic,
          }).success
        ).toBe(true)
  })
  it("rejects invented areas and topics belonging to another area", () => {
    expect(
      restaurantBriefSchema.safeParse({
        ...DEFAULT_BRIEF,
        areaId: "automobili",
      }).success
    ).toBe(false)
    expect(
      restaurantBriefSchema.safeParse({
        ...DEFAULT_BRIEF,
        topic: RESTAURANT_AREAS[8]!.topics[0],
      }).success
    ).toBe(false)
  })
  it("compiles restaurant context and preserves the owner's actual details", () => {
    const prompt = restaurantPrompt(
      {
        ...DEFAULT_BRIEF,
        restaurantName: "Il Melograno",
        purpose: "formazione",
      },
      "Lo chef prepara il risotto."
    )
    expect(prompt).toContain("Il Melograno")
    expect(prompt).toContain("Formare il personale")
    expect(prompt).toContain("Lo chef prepara il risotto.")
    expect(prompt).toContain("Non inventare prezzi")
  })
  it("adds approved-procedure guidance for food safety", () => {
    const area = RESTAURANT_AREAS[8]!
    expect(
      restaurantPrompt(
        { ...DEFAULT_BRIEF, areaId: area.id, topic: area.topics[0]! },
        "Sanificazione della cucina"
      )
    ).toContain("procedure approvate")
  })
  it("builds a free 3-scene storyboard and weaves Brand Kit identity", () => {
    const kit = restaurantBrandKitSchema.parse({
      restaurantName: "Osteria Il Melograno",
      cuisineType: "Cucina toscana stagionale",
      city: "Firenze",
      signatureOffer: "Pici al ragù bianco e cantina naturale",
      defaultCallToAction: "Prenota dal sito",
      defaultStyle: "cinematografico",
    })
    const brief = {
      ...DEFAULT_BRIEF,
      restaurantName: kit.restaurantName,
      cuisineType: kit.cuisineType,
      signatureOffer: kit.signatureOffer,
      callToAction: kit.defaultCallToAction,
    }
    const storyboard = buildRestaurantStoryboard(
      brief,
      "Impiattamento dei pici fatti a mano."
    )
    expect(storyboard.scenes).toHaveLength(3)
    expect(storyboard.recommendedAspectRatio).toBe("9:16")
    expect(storyboard.combinedAiPrompt).toContain("Osteria Il Melograno")
    const compiled = restaurantPrompt(brief, storyboard.scenes[0].aiPrompt)
    expect(compiled).toContain("Cucina toscana stagionale")
    expect(compiled).toContain("Pici al ragù bianco")
  })
  it("detects blatantly off-topic non-restaurant prompts", () => {
    expect(isOffTopicRestaurantPrompt("Trading forex e bitcoin")).toBe(true)
    expect(isOffTopicRestaurantPrompt("Gara automobilistica di Formula 1")).toBe(
      true
    )
    expect(
      isOffTopicRestaurantPrompt("Lo chef presenta il menù degustazione")
    ).toBe(false)
  })
})

describe("restaurant commercial rule", () => {
  it.each([
    [1, 150],
    [2, 300],
    [5, 750],
    [0.094, 15],
  ])("charges provider cost %s at a 50 percent markup", (usd, expected) => {
    expect(
      creditsFromUsd(usd, { markup: RESTAURANT_MARKUP, creditUsd: 0.01 })
    ).toBe(expected)
  })
})
