import type { Page } from "@playwright/test"

import { expect, test } from "./fixtures"

import { balance, dismissCookies, signIn, uniqueEmail } from "./helpers"

async function generateImage(page: Page, prompt: string) {
  await page.goto("/image")
  await dismissCookies(page)
  const field = page.getByRole("textbox", { name: /Describe the scene/ })
  await field.fill(prompt)
  await page.getByRole("button", { name: /^Genera/ }).click()
}

test("generate an image from a prompt: debit, generating tile, finished tile", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("image"), "/image")
  const before = await balance(page)
  await generateImage(
    page,
    "Un piatto di risotto ai funghi sul tavolo del ristorante"
  )
  await expect(
    page.getByRole("status").filter({ hasText: /Queued|Starting|Generating/ })
  ).toBeVisible()
  await expect.poll(() => balance(page)).toBeLessThan(before)
  const tile = page.getByRole("button", {
    name: /Open generation: Un piatto di risotto/,
  })
  await expect(tile).toBeVisible({ timeout: 45_000 })
  // The finished output survives a refresh (it's in the database, served from our storage).
  await page.reload()
  await expect(
    page.getByRole("button", { name: /Open generation: Un piatto di risotto/ })
  ).toBeVisible()
  await tile.first().click()
  await expect(page.getByRole("dialog")).toContainText(
    "Un piatto di risotto ai funghi sul tavolo del ristorante"
  )
})

test("content-filter blocks refund exactly once and stay visible", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("nsfw"), "/image")
  const before = await balance(page)
  await generateImage(page, "[nsfw] test the content filter")
  await expect(page.getByText("Blocked by content filter").first()).toBeVisible(
    { timeout: 45_000 }
  )
  await expect.poll(() => balance(page)).toBe(before)
})

test("failed runs show a failed tile and refund", async ({ page }) => {
  await signIn(page, uniqueEmail("fail"), "/image")
  const before = await balance(page)
  await generateImage(page, "[fail] this one breaks")
  await expect(page.getByText("Generation failed").first()).toBeVisible({
    timeout: 45_000,
  })
  await expect.poll(() => balance(page)).toBe(before)
})

test("cancel a queued run on the platform and get the credits back", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("cancel"), "/image")
  const before = await balance(page)
  await generateImage(page, "[slow] cancel me please")
  const tile = page.getByRole("status").filter({ hasText: /Queued|Starting/ })
  await expect(tile).toBeVisible()
  await tile.hover()
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByText("Canceled").first()).toBeVisible({
    timeout: 20_000,
  })
  await expect.poll(() => balance(page)).toBe(before)
})

test("not enough credits opens the upgrade modal", async ({ page }) => {
  await signIn(page, uniqueEmail("broke"), "/video")
  await dismissCookies(page)
  await page.getByRole("button", { name: "Cambia" }).first().click()
  await page.getByRole("textbox", { name: "Search models" }).fill("4K")
  await page
    .getByRole("button", { name: /Kling 3\.0 4K/ })
    .first()
    .click()
  await page
    .getByRole("textbox", { name: /Prompt|Describe|Descrivi/ })
    .first()
    .fill("Una panoramica della sala del ristorante")
  await page.getByRole("button", { name: /^(Duration|Durata):/ }).click()
  await page.getByRole("slider").first().press("End")
  await page.keyboard.press("Escape")
  const quoted = Number(
    (
      await page
        .getByRole("button", { name: /^Genera/ })
        .first()
        .innerText()
    ).match(/\d+/)?.[0]
  )
  expect(quoted).toBeGreaterThan(await balance(page))
  await page
    .getByRole("button", { name: /^Genera/ })
    .first()
    .click()
  await expect(
    page.getByRole("dialog", { name: /I tuoi crediti/ })
  ).toBeVisible()
})
