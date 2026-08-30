import { test, expect } from '@playwright/test'

/**
 * Task 6 smoke test: searching by name and selecting a result moves the
 * view and shows the same selection UI a tap/click would, with no console
 * errors. Unlike the tap-based selection smoke test (Task 5), which hits a
 * grid of screen points since it can't target one specific star, this can
 * search for a fixed name directly — Altair's info panel doesn't depend on
 * it currently being above the horizon (Starfield.tsx's
 * handleSelectStarResult), and Ursa Minor is circumpolar from the default
 * Tokyo location (see below), so both are always selectable regardless of
 * when this test runs.
 */
test('searching for a star and a constellation selects each, with no console errors', async ({
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

  const searchToggle = page.getByLabel('星・星座を検索')
  const searchInput = page.getByLabel('星座名・星名で検索')
  const closeButton = page.getByLabel('選択情報を閉じる')

  // Searching a star selects it (same info panel Task 5's tap selection shows).
  await searchToggle.click()
  await searchInput.fill('Altair')
  await page.getByRole('button', { name: /Altair/ }).click()
  await expect(closeButton).toBeVisible()
  await closeButton.click()
  await expect(closeButton).not.toBeVisible()

  // Searching a constellation selects it (its name label appears on the
  // sky) and, Task 7, opens the info panel showing its trivia text instead
  // of star-specific brightness/color — checking for the trivia text (only
  // rendered inside that panel, unlike the name, which the on-sky label
  // shares) confirms the panel itself opened. Ursa Minor (its dimmest star
  // ~72° dec) is circumpolar from the default Tokyo location (lat ~35.7°,
  // so anything above ~54° dec never sets) — always above the horizon
  // regardless of when this test runs, unlike most constellations.
  await searchToggle.click()
  await searchInput.fill('Ursa Minor')
  await page.getByRole('button', { name: /Ursa Minor/ }).click()
  await expect(page.getByText('北極星ポラリスを含む')).toBeVisible()
  await expect(closeButton).toBeVisible()
  await closeButton.click()
  await expect(closeButton).not.toBeVisible()

  expect(errors).toEqual([])
})
