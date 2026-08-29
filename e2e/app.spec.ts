import { test, expect } from '@playwright/test'

test('loads the page without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')

  await expect(page).toHaveTitle('Veluna')
  await expect(page.locator('canvas')).toBeVisible()
  expect(errors).toEqual([])
})
