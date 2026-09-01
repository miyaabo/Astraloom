import { describe, expect, it } from 'vitest'
import { buildSelectedCelestialBodyInfo } from './celestialBodyInfo'
import type { CelestialBodyState } from './celestialBodyTypes'

const BASE_PLANET: CelestialBodyState = {
  id: 'venus',
  kind: 'planet',
  horizontal: {
    azimuthDegrees: 120,
    altitudeDegrees: 18,
  },
  equatorial: {
    raHours: 10,
    decDegrees: 6,
  },
  distanceAu: 0.8,
  apparentMagnitude: -4,
  illuminatedFraction: 0.75,
}

describe('buildSelectedCelestialBodyInfo', () => {
  it('builds a calm label set for a planet selection', () => {
    const info = buildSelectedCelestialBodyInfo(BASE_PLANET)

    expect(info.displayName).toBe('Venus (金星)')
    expect(info.categoryLabel).toBe('惑星')
    expect(info.brightnessLabel).toBe('目立つ')
    expect(info.colorLabel).toBe('少し暖かい')
    expect(info.detailLabel).toBe('よく見えている')
  })

  it('labels the moon as moon-specific instead of a planet', () => {
    const info = buildSelectedCelestialBodyInfo({
      ...BASE_PLANET,
      id: 'moon',
      kind: 'moon',
      illuminatedFraction: 0.95,
    })

    expect(info.displayName).toBe('Moon (月)')
    expect(info.categoryLabel).toBe('月')
    expect(info.colorLabel).toBe('白っぽい')
    expect(info.detailLabel).toBe('ほぼ満ちている')
  })

  it('surfaces when a selected body is currently below the horizon', () => {
    const info = buildSelectedCelestialBodyInfo({
      ...BASE_PLANET,
      horizontal: {
        azimuthDegrees: 250,
        altitudeDegrees: -8,
      },
      illuminatedFraction: 0.75,
    })

    expect(info.detailLabel).toBe('現在は地平線の下にいる / よく見えている')
  })
})
