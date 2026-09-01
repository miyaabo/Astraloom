import { describe, expect, it } from 'vitest'
import type { ObserverLocation } from '../astronomy/coordinates'
import { generateCelestialBodyRenderData } from './celestialBodyDataSource'

const TOKYO: ObserverLocation = {
  latitudeDegrees: 35.6762,
  longitudeDegrees: 139.6503,
}

describe('celestialBodyDataSource', () => {
  it('returns visible phase-7 bodies in a stable order', () => {
    const bodies = generateCelestialBodyRenderData(
      TOKYO,
      new Date('2026-09-01T00:00:00Z'),
    )

    expect(bodies.map((body) => body.id)).toEqual([
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
    ])
  })

  it('keeps the moon visually stronger than visible planets', () => {
    const bodies = generateCelestialBodyRenderData(
      TOKYO,
      new Date('2026-09-01T00:00:00Z'),
    )

    const moon = bodies.find((body) => body.id === 'moon')
    const planets = bodies.filter((body) => body.kind === 'planet')

    expect(moon).toBeDefined()
    expect(planets.length).toBeGreaterThan(0)
    expect(
      planets.every((planet) => moon!.sizeScale > planet.sizeScale),
    ).toBe(true)
  })
})
