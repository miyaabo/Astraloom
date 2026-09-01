import { describe, expect, it } from 'vitest'
import { calculatePlanetStates } from './planetStateSource'

describe('planetStateSource', () => {
  it('calculates the supported planets in a stable phase-7 order', () => {
    const states = calculatePlanetStates(
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      new Date('2026-09-01T00:00:00.000Z'),
    )

    expect(states.map((state) => state.id)).toEqual([
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
    ])
    expect(states.every((state) => state.kind === 'planet')).toBe(true)
  })

  it('returns equatorial and horizontal coordinates plus magnitude data for each planet', () => {
    const states = calculatePlanetStates(
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      new Date('2026-09-01T00:00:00.000Z'),
    )

    const mercury = states[0]
    const venus = states[1]
    const mars = states[2]
    const jupiter = states[3]
    const saturn = states[4]

    expect(mercury.equatorial.raHours).toBeCloseTo(10.9774753493, 8)
    expect(mercury.equatorial.decDegrees).toBeCloseTo(8.2469242573, 8)
    expect(mercury.horizontal.azimuthDegrees).toBeCloseTo(112.7610622387, 8)
    expect(mercury.horizontal.altitudeDegrees).toBeCloseTo(40.8434808358, 8)
    expect(mercury.distanceAu).toBeCloseTo(1.376748316, 8)
    expect(mercury.apparentMagnitude).toBeCloseTo(-1.4896875331, 8)
    expect(mercury.illuminatedFraction).toBeCloseTo(0.9893897608, 8)

    expect(venus.horizontal.altitudeDegrees).toBeCloseTo(1.0102480244, 8)
    expect(venus.apparentMagnitude).toBeCloseTo(-4.6331780149, 8)
    expect(mars.horizontal.altitudeDegrees).toBeCloseTo(71.9166295661, 8)
    expect(mars.apparentMagnitude).toBeCloseTo(1.2538931001, 8)
    expect(jupiter.horizontal.altitudeDegrees).toBeCloseTo(66.4431936613, 8)
    expect(jupiter.apparentMagnitude).toBeCloseTo(-1.79632863, 8)
    expect(saturn.horizontal.altitudeDegrees).toBeCloseTo(-10.7553938356, 8)
    expect(saturn.apparentMagnitude).toBeCloseTo(0.3434850664, 8)
  })

  it('keeps below-horizon planets in runtime state so later rendering can decide visibility', () => {
    const states = calculatePlanetStates(
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      new Date('2026-09-01T00:00:00.000Z'),
    )

    const saturn = states.find((state) => state.id === 'saturn')
    expect(saturn?.horizontal.altitudeDegrees).toBeLessThan(0)
  })
})
