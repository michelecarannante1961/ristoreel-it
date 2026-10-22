import "server-only"

/** ECB quotes USD per EUR. Display conversion only; Stripe currency must be configured before launch. */
export type EuroDisplayRate = { eurPerCredit: number; date: string }

export function parseEcbRate(
  xml: string
): { eurPerUsd: number; date: string } | null {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1]
  const usd = Number(
    xml.match(/currency=['"]USD['"]\s+rate=['"]([\d.]+)['"]/)?.[1]
  )
  if (!date || !Number.isFinite(usd) || usd <= 0) return null
  const age = Date.now() - Date.parse(`${date}T00:00:00Z`)
  if (age < -86_400_000 || age > 7 * 86_400_000) return null
  return { eurPerUsd: 1 / usd, date }
}

let cached: { at: number; value: EuroDisplayRate | null } | undefined

export async function euroDisplayRate(
  creditUsd: number
): Promise<EuroDisplayRate | null> {
  if (cached && Date.now() - cached.at < (cached.value ? 3_600_000 : 60_000))
    return cached.value
  let value: EuroDisplayRate | null = null
  try {
    const response = await fetch(
      "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
      { signal: AbortSignal.timeout(3000), cache: "no-store" }
    )
    if (response.ok) {
      const rate = parseEcbRate(await response.text())
      if (rate)
        value = { eurPerCredit: creditUsd * rate.eurPerUsd, date: rate.date }
    }
  } catch {
    /* No invented exchange rate when the source is unavailable. */
  }
  cached = { at: Date.now(), value }
  return value
}
