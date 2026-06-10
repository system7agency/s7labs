import { test } from '@playwright/test'
test('cards', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/mini-apps', { waitUntil:'networkidle' })
  await page.waitForTimeout(1500)
  // scroll to the card grid
  const card = page.locator('.mx-card, [data-status]').first()
  await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path:'/tmp/cards.png' })
  // count live vs draft chips
  const live = await page.locator('.mx-chip.live').count()
  const draft = await page.locator('.mx-chip.draft').count()
  console.log('LIVE chips:', live, 'DRAFT chips:', draft)
})
