import { test, expect } from '@playwright/test'

/**
 * Task 5 smoke test: tapping/clicking a star opens its info panel, and
 * closing it returns to the plain starfield, without any console errors.
 * Real star positions depend on the live date/time/location the app boots
 * with, so this can't target one exact pixel — instead it clicks across a
 * grid of points until one lands on a star (the catalog is dense enough,
 * ~4000+ visible stars, that a grid this size reliably hits one within the
 * hit-test radius).
 */
test('clicking a star shows its info panel; closing it clears the selection, with no console errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(300)

  const box = await canvas.boundingBox()
  if (!box) throw new Error('no canvas bounding box')

  const closeButton = page.getByLabel('選択情報を閉じる')
  let hit = false

  gridLoop: for (let row = 1; row < 10; row++) {
    for (let col = 1; col < 12; col++) {
      const x = box.x + (box.width * col) / 12
      const y = box.y + (box.height * row) / 10
      await page.mouse.click(x, y)
      if (await closeButton.isVisible()) {
        hit = true
        break gridLoop
      }
    }
  }

  expect(hit).toBe(true)
  await expect(closeButton).toBeVisible()

  await closeButton.click()
  await expect(closeButton).not.toBeVisible()

  expect(errors).toEqual([])
})
