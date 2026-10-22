import type { MetadataRoute } from "next"
import { BRAND } from "@/lib/brand"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.APP_URL || BRAND.productionUrl).replace(/\/$/, "")
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/community", "/effects", "/legal/"],
        disallow: ["/api/", "/admin", "/account", "/assets", "/login/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
