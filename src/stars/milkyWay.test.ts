import { describe, expect, it } from 'vitest'
import type { ObserverLocation } from '../astronomy/coordinates'
import {
  galacticToEquatorial,
  generateMilkyWayBand,
} from './milkyWay'
import { SKY_SPHERE_RADIUS } from './skyProjection'
import { starfieldConfig } from './starfieldConfig'

const TOKYO: ObserverLocation = {
  latitudeDegrees: 35.6762,
  longitudeDegrees: 139.6503,
}
const FIXED_DATE = new Date('2026-08-29T21:00:00+09:00')

describe('galacticToEquatorial', () => {
  it('places the galactic center near its well-known equatorial coordinates (Sagittarius, RA ~17.76h, Dec ~-28.9deg)', () => {
    const { raHours, decDegrees } = galacticToEquatorial(0, 0)
    expect(raHours).toBeCloseTo(17.76, 0)
    expect(decDegrees).toBeCloseTo(-28.9, 0)
  })

  it('places the north galactic pole near its well-known equatorial coordinates (RA ~12.86h, Dec ~+27.1deg)', () => {
    const { raHours, decDegrees } = galacticToEquatorial(0, 90)
    expect(raHours).toBeCloseTo(12.86, 1)
    expect(decDegrees).toBeCloseTo(27.1, 0)
  })

  it('always returns valid RA/Dec ranges', () => {
    for (let l = 0; l < 360; l += 37) {
      for (let b = -90; b <= 90; b += 41) {
        const { raHours, decDegrees } = galacticToEquatorial(l, b)
        expect(raHours).toBeGreaterThanOrEqual(0)
        expect(raHours).toBeLessThan(24)
        expect(decDegrees).toBeGreaterThanOrEqual(-90)
        expect(decDegrees).toBeLessThanOrEqual(90)
      }
    }
  })
})

describe('generateMilkyWayBand', () => {
  const points = generateMilkyWayBand(TOKYO, FIXED_DATE)

  it('keeps roughly half the configured particle count above the horizon', () => {
    expect(points.length).toBeGreaterThan(
      starfieldConfig.milkyWay.particleCount * 0.2,
    )
    expect(points.length).toBeLessThan(
      starfieldConfig.milkyWay.particleCount * 0.8,
    )
  })

  it('places every visible particle on the sky sphere, above the horizon plane', () => {
    for (const point of points) {
      const distance = Math.hypot(
        point.position.x,
        point.position.y,
        point.position.z,
      )
      expect(distance).toBeCloseTo(SKY_SPHERE_RADIUS, 6)
      expect(point.position.y).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('keeps brightness within [0, 1]', () => {
    for (const point of points) {
      expect(point.brightness).toBeGreaterThanOrEqual(0)
      expect(point.brightness).toBeLessThanOrEqual(1)
    }
  })

  it('returns a stable particle layout across repeated calls for the same date/location', () => {
    const again = generateMilkyWayBand(TOKYO, FIXED_DATE)
    expect(again.length).toBe(points.length)
    expect(again[0]).toEqual(points[0])
  })

  it('changes the band arrangement when the observer location changes', () => {
    const london: ObserverLocation = {
      latitudeDegrees: 51.5074,
      longitudeDegrees: -0.1278,
    }
    const otherPoints = generateMilkyWayBand(london, FIXED_DATE)
    expect(otherPoints.length).not.toBe(points.length)
  })
})
