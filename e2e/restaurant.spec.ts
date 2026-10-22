import { expect, test } from "./fixtures"
import { balance, signIn, uniqueEmail } from "./helpers"

test("all restaurant areas are searchable and carry their purpose and topic into the studio", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator(".risto-area")).toHaveCount(20)
  await page
    .getByRole("button", { name: "Formare il personale", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "Cerca un ambito o un argomento" })
    .fill("HACCP")
  await expect(page.locator(".risto-area")).toHaveCount(1)
  await page.getByRole("button", { name: "Tutti gli argomenti +" }).click()
  await page
    .getByRole("link", { name: "Piano di autocontrollo HACCP", exact: true })
    .click()
  await page.waitForURL(/\/video/, { timeout: 60_000 })
  await expect(
    page.getByRole("combobox", { name: "Ambito", exact: true })
  ).toHaveValue("sicurezza-alimentare")
  await expect(
    page.getByRole("combobox", { name: "Sottoargomento", exact: true })
  ).toHaveValue("Piano di autocontrollo HACCP")
  await expect(
    page.getByRole("combobox", { name: "Obiettivo", exact: true })
  ).toHaveValue("formazione")
  await page.reload()
  await expect(
    page.getByRole("combobox", { name: "Obiettivo", exact: true })
  ).toHaveValue("formazione")
  await expect(
    page.getByRole("combobox", { name: "Ambito", exact: true })
  ).toHaveValue("sicurezza-alimentare")
})

test("an inspiration opens a restaurant prompt, generates a simulated clip and preserves its brief", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("ristorazione"), "/")
  await page.getByRole("link", { name: /Racconta il tuo menù/ }).click()
  const description = page.getByRole("textbox", { name: /Descrivi la scena/ })
  await expect(description).toHaveValue(/piatto del giorno/)
  await page
    .getByRole("textbox", { name: "Nome del locale", exact: true })
    .fill("Ristorante di prova")
  const before = await balance(page)
  const button = page.getByRole("button", { name: /^Genera/ }).first()
  await expect(button).toBeEnabled()
  const acceptedCredits = Number((await button.innerText()).match(/\d+/)?.[0])
  expect(acceptedCredits).toBeGreaterThan(0)
  await button.click()
  await expect.poll(() => balance(page)).toBe(before - acceptedCredits)
  await expect
    .poll(
      async () => {
        const data = await (
          await page.request.get("/api/generations?surface=video")
        ).json()
        return data.items?.[0]?.status
      },
      { timeout: 60_000 }
    )
    .toBe("completed")
  const data = await (
    await page.request.get("/api/generations?surface=video")
  ).json()
  const run = data.items[0]
  expect(run.restaurant.restaurantName).toBe("Ristorante di prova")
  expect(run.restaurant.areaId).toBe("menu")
  expect(run.cost).toBe(acceptedCredits)
  expect(run.outputs[0].kind).toBe("video")
  expect((await page.request.get(run.outputs[0].url)).status()).toBe(200)
  await expect(page.locator("video").first()).toBeVisible({ timeout: 30_000 })
  await page
    .locator("video")
    .first()
    .evaluate(async (video: HTMLVideoElement) => {
      if (video.readyState >= 2) return
      await new Promise<void>((resolve) =>
        video.addEventListener("loadeddata", () => resolve(), { once: true })
      )
    })
  await page.screenshot({ path: ".data/studio-desktop.png", fullPage: false })
})

test("restaurant home and studio fit a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(0)
  await page.screenshot({ path: ".data/home-mobile.png", fullPage: true })
  await page.goto("/video?ambito=food-cost")
  await expect(
    page.getByRole("combobox", { name: "Ambito", exact: true })
  ).toHaveValue("food-cost")
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(0)
  await expect(
    page.getByRole("button", { name: /^Genera/ }).last()
  ).toBeInViewport()
})
