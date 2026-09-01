import { describe, expect, it } from 'vitest'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import {
  createCelestialBodyRenderData,
  createCelestialBodyRenderDataList,
} from './celestialBodyRenderData'
import type { CelestialBodyState } from './celestialBodyTypes'

const BASE_PLANET_STATE: CelestialBodyState = {
  id: 'venus',
  kind: 'planet',
  horizontal: {
    azimuthDegrees: 120,
    altitudeDegrees: 32,
  },
  equatorial: {
    raHours: 10,
    decDegrees: 15,
  },
  distanceAu: 0.7,
  apparentMagnitude: -4.2,
  illuminatedFraction: 0.8,
}

describe('celestialBodyRenderData', () => {
  it('projects visible bodies onto the same sky sphere as stars', () => {
    const renderData = createCelestialBodyRenderData(BASE_PLANET_STATE)

    expect(renderData).not.toBeNull()
    const position = renderData!.position
    expect(Math.hypot(position.x, position.y, position.z)).toBeCloseTo(
      SKY_SPHERE_RADIUS,
      6,
    )
    expect(position.y).toBeGreaterThan(0)
  })

  it('drops below-horizon bodies before renderer integration', () => {
    const renderData = createCelestialBodyRenderData({
      ...BASE_PLANET_STATE,
      id: 'mars',
      horizontal: {
        azimuthDegrees: 200,
        altitudeDegrees: -3,
      },
    })

    expect(renderData).toBeNull()
  })

  it('keeps moon rendering distinct from planets with larger visual scales', () => {
    const planet = createCelestialBodyRenderData(BASE_PLANET_STATE)
    const moon = createCelestialBodyRenderData({
      ...BASE_PLANET_STATE,
      id: 'moon',
      kind: 'moon',
      apparentMagnitude: -11.8,
    })

    expect(planet).not.toBeNull()
    expect(moon).not.toBeNull()
    expect(planet!.visualClass).toBe('warm')
    expect(moon!.visualClass).toBe('moon')
    expect(moon!.brightness).toBeGreaterThan(planet!.brightness)
    expect(moon!.sizeScale).toBeGreaterThan(planet!.sizeScale)
  })

  it('softens brightness and size for bodies close to the horizon', () => {
    const lowAltitude = createCelestialBodyRenderData({
      ...BASE_PLANET_STATE,
      id: 'mercury',
      horizontal: {
        azimuthDegrees: 120,
        altitudeDegrees: 2,
      },
    })
    const highAltitude = createCelestialBodyRenderData({
      ...BASE_PLANET_STATE,
      id: 'mercury',
      horizontal: {
        azimuthDegrees: 120,
        altitudeDegrees: 42,
      },
    })

    expect(lowAltitude).not.toBeNull()
    expect(highAltitude).not.toBeNull()
    expect(lowAltitude!.brightness).toBeLessThan(highAltitude!.brightness)
    expect(lowAltitude!.sizeScale).toBeLessThan(highAltitude!.sizeScale)
  })

  it('preserves input order while filtering out invisible bodies', () => {
    const list = createCelestialBodyRenderDataList([
      {
        ...BASE_PLANET_STATE,
        id: 'mercury',
        apparentMagnitude: -0.4,
      },
      {
        ...BASE_PLANET_STATE,
        id: 'saturn',
        horizontal: {
          azimuthDegrees: 310,
          altitudeDegrees: -8,
        },
      },
      {
        ...BASE_PLANET_STATE,
        id: 'jupiter',
        apparentMagnitude: -2.7,
      },
    ])

    expect(list.map((body) => body.id)).toEqual(['mercury', 'jupiter'])
  })

  it('falls back to a mid-tier brightness when magnitude is unavailable', () => {
    const renderData = createCelestialBodyRenderData({
      ...BASE_PLANET_STATE,
      id: 'jupiter',
      apparentMagnitude: null,
    })

    expect(renderData).not.toBeNull()
    expect(renderData!.brightness).toBeGreaterThan(0.4)
    expect(renderData!.brightness).toBeLessThan(0.7)
  })
})
