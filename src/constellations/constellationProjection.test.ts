import { describe, expect, it, vi } from 'vitest'
import type { HygStarRecord } from '../stars/starTypes'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import type { ConstellationRecord } from './constellationTypes'

const FIXTURE_STARS: HygStarRecord[] = [
  // Overhead for a north-pole observer at RA 0h (visible any time).
  {
    id: 1,
    raHours: 0,
    decDegrees: 89,
    magnitude: 1,
    colorIndex: 0,
    properName: 'Fixture Alpha',
  },
  {
    id: 2,
    raHours: 6,
    decDegrees: 89,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  // Far south of a north-pole observer's horizon, always below it.
  {
    id: 3,
    raHours: 0,
    decDegrees: -80,
    magnitude: 1,
    colorIndex: 0,
    properName: 'Fixture Below Horizon',
  },
]

vi.mock('../stars/hygCatalogSource', () => ({
  loadHygStarCatalog: () => FIXTURE_STARS,
}))

const {
  computeConstellationLineSegments,
  computeConstellationLookDirection,
  computeConstellationStarLabels,
} = await import('./constellationProjection')

const NORTH_POLE = { latitudeDegrees: 90, longitudeDegrees: 0 }
const ANY_DATE = new Date('2026-01-01T00:00:00Z')

describe('computeConstellationLineSegments', () => {
  it('projects a visible segment onto the sky sphere', () => {
    const constellation: ConstellationRecord = {
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[1, 2]],
    }

    const segments = computeConstellationLineSegments(
      constellation,
      NORTH_POLE,
      ANY_DATE,
    )

    expect(segments.length).toBe(1)
    for (const point of [segments[0].start, segments[0].end]) {
      const radius = Math.hypot(point.x, point.y, point.z)
      expect(radius).toBeCloseTo(SKY_SPHERE_RADIUS, 5)
    }
  })

  it('drops a segment when either endpoint is below the horizon', () => {
    const constellation: ConstellationRecord = {
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [
        [1, 3],
        [1, 2],
      ],
    }

    const segments = computeConstellationLineSegments(
      constellation,
      NORTH_POLE,
      ANY_DATE,
    )

    expect(segments.length).toBe(1)
  })

  it('ignores segments referencing unknown star ids', () => {
    const constellation: ConstellationRecord = {
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[1, 999]],
    }

    const segments = computeConstellationLineSegments(
      constellation,
      NORTH_POLE,
      ANY_DATE,
    )

    expect(segments).toEqual([])
  })
})

describe('computeConstellationLookDirection', () => {
  it('returns null for an empty segment list', () => {
    expect(computeConstellationLookDirection([])).toBeNull()
  })

  it('points toward the average direction of the segments', () => {
    const direction = computeConstellationLookDirection([
      { start: { x: 0, y: 0, z: -1 }, end: { x: 0, y: 0, z: -1 } },
    ])

    expect(direction).not.toBeNull()
    expect(direction?.azimuthDegrees).toBeCloseTo(0, 5)
    expect(direction?.altitudeDegrees).toBeCloseTo(0, 5)
  })
})

describe('computeConstellationStarLabels', () => {
  it('labels only visible stars with a proper name, without duplicates', () => {
    const constellation: ConstellationRecord = {
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      // Star 1 (named, visible) appears in two segments; star 2 has no
      // proper name; star 3 is named but below the horizon.
      segments: [
        [1, 2],
        [1, 3],
      ],
    }

    const labels = computeConstellationStarLabels(
      constellation,
      NORTH_POLE,
      ANY_DATE,
    )

    expect(labels).toHaveLength(1)
    expect(labels[0].starId).toBe(1)
    expect(labels[0].properName).toBe('Fixture Alpha')
  })

  it('returns no labels when no segment star has a proper name', () => {
    const constellation: ConstellationRecord = {
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[2, 2]],
    }

    const labels = computeConstellationStarLabels(
      constellation,
      NORTH_POLE,
      ANY_DATE,
    )

    expect(labels).toEqual([])
  })
})
