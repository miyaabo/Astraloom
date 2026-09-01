import { describe, expect, it } from 'vitest'
import { loadHygStarCatalog } from './hygCatalogSource'

describe('loadHygStarCatalog', () => {
  const stars = loadHygStarCatalog()

  it('keeps a density close to the phase-0 placeholder star count', () => {
    // D013: mag<=6.5 filtering targets ~9,000-9,600 stars, near the 0次
    // placeholder's 6,000 so the eventual real-data density feels similar.
    expect(stars.length).toBeGreaterThan(5000)
    expect(stars.length).toBeLessThan(12000)
  })

  it('has unique ids', () => {
    const ids = new Set(stars.map((star) => star.id))
    expect(ids.size).toBe(stars.length)
  })

  it('excludes the Sun (HYG id 0)', () => {
    expect(stars.some((star) => star.id === 0)).toBe(false)
  })

it('keeps every star within its documented range', { timeout: 15000 }, () => {
    for (const star of stars) {
      expect(star.raHours).toBeGreaterThanOrEqual(0)
      expect(star.raHours).toBeLessThan(24)

      expect(star.decDegrees).toBeGreaterThanOrEqual(-90)
      expect(star.decDegrees).toBeLessThanOrEqual(90)

      expect(star.magnitude).toBeLessThanOrEqual(6.5)

      if (star.colorIndex !== null) {
        expect(Number.isFinite(star.colorIndex)).toBe(true)
      }
    }
  })

  it('includes known bright stars (Sirius, Vega) within the filtered set', () => {
    // Sirius and Vega are canonical bright-star fixtures reused by Task 3's
    // alt/az verification; confirm the catalog carries them through the
    // magnitude filter at roughly their known equatorial coordinates.
    const sirius = stars.find(
      (star) =>
        Math.abs(star.raHours - 6.7525) < 0.01 &&
        Math.abs(star.decDegrees - -16.7161) < 0.5,
    )
    const vega = stars.find(
      (star) =>
        Math.abs(star.raHours - 18.6156) < 0.01 &&
        Math.abs(star.decDegrees - 38.7837) < 0.5,
    )

    expect(sirius).toBeDefined()
    expect(sirius?.magnitude).toBeLessThan(-1)

    expect(vega).toBeDefined()
    expect(vega?.magnitude).toBeLessThan(0.5)
  })
})
