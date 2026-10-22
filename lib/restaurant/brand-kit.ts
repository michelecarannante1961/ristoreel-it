import { z } from "zod"

import { STYLES } from "./brief"

export const brandKitMediaSchema = z.object({
  url: z.url().max(2048),
  label: z.string().trim().max(80),
  role: z.enum(["piatto", "sala", "logo", "staff"]).default("piatto"),
})

export const restaurantBrandKitSchema = z.object({
  restaurantName: z.string().trim().max(120).default(""),
  cuisineType: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  signatureOffer: z.string().trim().max(240).default(""),
  defaultCallToAction: z.string().trim().max(160).default(""),
  defaultStyle: z
    .enum(Object.keys(STYLES) as [keyof typeof STYLES, ...(keyof typeof STYLES)[]])
    .default("cinematografico"),
  referenceMedia: z.array(brandKitMediaSchema).max(8).default([]),
})

export type RestaurantBrandKit = z.infer<typeof restaurantBrandKitSchema>
export type BrandKitMedia = z.infer<typeof brandKitMediaSchema>

export const DEFAULT_BRAND_KIT: RestaurantBrandKit = {
  restaurantName: "",
  cuisineType: "",
  city: "",
  signatureOffer: "",
  defaultCallToAction: "",
  defaultStyle: "cinematografico",
  referenceMedia: [],
}
