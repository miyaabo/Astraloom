import { describe, expect, it } from 'vitest'
import type { ObserverLocation } from '../astronomy/coordinates'
import { loadHygStarCatalog } from './hygCatalogSource'
import { generateRealStarData } from './realStarDataSource'
import { SKY_SPHERE_RADIUS } from './skyProjection'
import { starfieldConfig } from './starfieldConfig'

const TOKYO: ObserverLocation = {
  latitudeDegrees: 35.6762,
  longitudeDegrees: 139.6503,
}
const FIXED_DATE = new Date('2026-08-29T21:00:00+09:00')

describe('generateRealStarData', () => {
  const stars = generateRealStarData(TOKYO, FIXED_DATE)
  const catalogSize = loadHygStarCatalog().length

  it('drops stars below the horizon, keeping roughly half the catalog', () => {
    expect(stars.length).toBeGreaterThan(catalogSize * 0.3)
    expect(stars.length).toBeLessThan(catalogSize * 0.7)
  })

  it('has unique sequential ids', () => {
    stars.forEach((star, index) => expect(star.id).toBe(index))
  })

  it('carries the underlying HYG catalog id for each star', () => {
    const catalogIds = new Set(loadHygStarCatalog().map((record) => record.id))
    for (const star of stars) {
      expect(catalogIds.has(star.hygId)).toBe(true)
    }
  })

  it('places every visible star on the sky sphere, above the horizon plane', () => {
    for (const star of stars) {
      const distance = Math.hypot(
        star.position.x,
        star.position.y,
        star.position.z,
      )
      expect(distance).toBeCloseTo(SKY_SPHERE_RADIUS, 6)
      expect(star.position.y).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('keeps brightness within the configured range', () => {
    for (const star of stars) {
      expect(star.brightness).toBeGreaterThanOrEqual(
        starfieldConfig.brightness.min,
      )
      expect(star.brightness).toBeLessThanOrEqual(
        starfieldConfig.brightness.max,
      )
    }
  })

  it('only uses documented color categories', () => {
    for (const star of stars) {
      expect(['white', 'blueWhite', 'paleOrange']).toContain(star.colorCategory)
    }
  })

  it('keeps white as the majority color, matching the Visual Target', () => {
    const whiteShare =
      stars.filter((star) => star.colorCategory === 'white').length /
      stars.length
    expect(whiteShare).toBeGreaterThan(0.65)
  })

  it('gives the brightest visible star a high brightness value', () => {
    const brightest = stars.reduce((max, star) =>
      star.brightness > max.brightness ? star : max,
    )
    expect(brightest.brightness).toBeGreaterThan(0.8)
  })

  it('changes the star arrangement when the observer location changes', () => {
    const london: ObserverLocation = {
      latitudeDegrees: 51.5074,
      longitudeDegrees: -0.1278,
    }
    const otherStars = generateRealStarData(london, FIXED_DATE)
    expect(otherStars.length).not.toBe(stars.length)
  })
})
