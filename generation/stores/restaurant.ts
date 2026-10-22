"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  DEFAULT_BRIEF,
  restaurantBriefSchema,
  type RestaurantBrief,
} from "@/lib/restaurant/brief"
import {
  DEFAULT_BRAND_KIT,
  restaurantBrandKitSchema,
  type RestaurantBrandKit,
} from "@/lib/restaurant/brand-kit"
import { restaurantArea } from "@/lib/restaurant/catalog"

// Keep a single persisted brief and restaurant Brand Kit across create/edit/motion and authentication.
export const useRestaurant = create<{
  brief: RestaurantBrief
  brandKit: RestaurantBrandKit
  update: (patch: Partial<RestaurantBrief>) => void
  chooseArea: (id: string) => void
  setBrandKit: (kit: RestaurantBrandKit) => void
  applyBrandKit: (kit?: RestaurantBrandKit) => void
}>()(
  persist(
    (set, get) => ({
      brief: DEFAULT_BRIEF,
      brandKit: DEFAULT_BRAND_KIT,
      update: (patch) =>
        set((state) => ({ brief: { ...state.brief, ...patch } })),
      chooseArea: (id) => {
        const area = restaurantArea(id)
        if (area)
          set((state) => ({
            brief: { ...state.brief, areaId: area.id, topic: area.topics[0]! },
          }))
      },
      setBrandKit: (kit) => set({ brandKit: kit }),
      applyBrandKit: (override) => {
        const kit = override ?? get().brandKit
        set((state) => ({
          brandKit: kit,
          brief: {
            ...state.brief,
            restaurantName: kit.restaurantName || state.brief.restaurantName,
            callToAction: kit.defaultCallToAction || state.brief.callToAction,
            style: kit.defaultStyle || state.brief.style,
            ...(kit.cuisineType ? { cuisineType: kit.cuisineType } : {}),
            ...(kit.signatureOffer
              ? { signatureOffer: kit.signatureOffer }
              : {}),
          },
        }))
      },
    }),
    {
      name: "ristovideo-brief-v1",
      partialize: (state) => ({
        brief: state.brief,
        brandKit: state.brandKit,
      }),
      merge: (persisted, current) => {
        const rawBrief =
          persisted && typeof persisted === "object" && "brief" in persisted
            ? persisted.brief
            : null
        const rawKit =
          persisted && typeof persisted === "object" && "brandKit" in persisted
            ? persisted.brandKit
            : null
        const parsedBrief = restaurantBriefSchema.safeParse(rawBrief)
        const parsedKit = restaurantBrandKitSchema.safeParse(rawKit)
        return {
          ...current,
          brief: parsedBrief.success ? parsedBrief.data : DEFAULT_BRIEF,
          brandKit: parsedKit.success ? parsedKit.data : DEFAULT_BRAND_KIT,
        }
      },
    }
  )
)
