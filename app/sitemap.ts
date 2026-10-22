import type { MetadataRoute } from "next"
import { BRAND } from "@/lib/brand"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.APP_URL || BRAND.productionUrl).replace(/\/$/, "")
  const now = new Date()
  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/video", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/effects", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/community", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/legal/terms", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/legal/privacy", priority: 0.4, changeFrequency: "yearly" as const },
    {
      path: "/legal/acceptable-use",
      priority: 0.4,
      changeFrequency: "yearly" as const,
    },
  ]
  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
