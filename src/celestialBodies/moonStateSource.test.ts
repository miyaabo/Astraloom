import { describe, expect, it } from 'vitest'
import { calculateMoonState } from './moonStateSource'

describe('moonStateSource', () => {
  it('calculates moon coordinates and illumination state for a given date and location', () => {
    const moon = calculateMoonState(
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      new Date('2026-09-01T00:00:00.000Z'),
    )

    expect(moon.id).toBe('moon')
    expect(moon.kind).toBe('moon')
    expect(moon.equatorial.raHours).toBeCloseTo(1.4086912202, 8)
    expect(moon.equatorial.decDegrees).toBeCloseTo(13.3121040969, 8)
    expect(moon.horizontal.azimuthDegrees).toBeCloseTo(285.8352847439, 8)
    expect(moon.horizontal.altitudeDegrees).toBeCloseTo(1.224569076, 8)
    expect(moon.distanceAu).toBeCloseTo(0.0025243206, 10)
    expect(moon.apparentMagnitude).toBeCloseTo(-11.4959265645, 8)
    expect(moon.illuminatedFraction).toBeCloseTo(0.841775227, 8)
    expect(moon.phaseAngleDegrees).toBeCloseTo(46.8782850595, 8)
    expect(moon.moonPhaseDegrees).toBeCloseTo(226.8278974231, 8)
  })

  it('keeps moon-specific phase values within safe ranges', () => {
    const moon = calculateMoonState(
      {
        latitudeDegrees: 51.5074,
        longitudeDegrees: -0.1278,
      },
      new Date('2026-12-31T23:30:00.000Z'),
    )

    expect(moon.illuminatedFraction).not.toBeNull()
    expect(moon.illuminatedFraction!).toBeGreaterThanOrEqual(0)
    expect(moon.illuminatedFraction!).toBeLessThanOrEqual(1)
    expect(moon.phaseAngleDegrees).toBeDefined()
    expect(moon.phaseAngleDegrees!).toBeGreaterThanOrEqual(0)
    expect(moon.phaseAngleDegrees!).toBeLessThanOrEqual(180)
    expect(moon.moonPhaseDegrees).toBeGreaterThanOrEqual(0)
    expect(moon.moonPhaseDegrees).toBeLessThan(360)
  })

  it('keeps below-horizon handling in runtime state instead of filtering the moon out', () => {
    const moon = calculateMoonState(
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      new Date('2026-09-01T12:00:00.000Z'),
    )

    expect(typeof moon.horizontal.altitudeDegrees).toBe('number')
  })
})
