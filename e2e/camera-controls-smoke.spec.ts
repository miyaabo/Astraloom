import { test, expect } from '@playwright/test'

test('drag and wheel input change the view without console errors', async ({
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

  const before = await canvas.screenshot()

  const box = await canvas.boundingBox()
  if (!box) throw new Error('no canvas bounding box')
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2

  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX + 250, centerY - 120, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(200)

  const afterDrag = await canvas.screenshot()
  expect(Buffer.compare(before, afterDrag)).not.toBe(0)

  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(200)

  const afterZoom = await canvas.screenshot()
  expect(Buffer.compare(afterDrag, afterZoom)).not.toBe(0)

  expect(errors).toEqual([])
})
