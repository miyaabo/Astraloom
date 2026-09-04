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
  // For a north-pole observer, altitude equals declination exactly (the
  // celestial equator sits right at the horizon all the way round), so these
  // give predictable, distinct altitudes for ranking tests.
  {
    id: 4,
    raHours: 0,
    decDegrees: 3,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  {
    id: 5,
    raHours: 0,
    decDegrees: 20,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  // On the celestial equator, 90deg apart in RA — a simple, easy-to-verify
  // pair for equatorial-center averaging tests (their Cartesian average
  // points exactly halfway between them, at RA 3h, dec 0).
  {
    id: 6,
    raHours: 0,
    decDegrees: 0,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  {
    id: 7,
    raHours: 6,
    decDegrees: 0,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
]

vi.mock('../stars/hygCatalogSource', () => ({
  loadHygStarCatalog: () => FIXTURE_STARS,
}))

const {
  computeConstellationEquatorialCenter,
  computeConstellationLineSegments,
  computeConstellationLookDirection,
  computeConstellationStarLabels,
  findConstellationZenithLocation,
  rankConstellationsByAltitude,
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

describe('rankConstellationsByAltitude', () => {
  const HIGH: ConstellationRecord = {
    id: 'High',
    name: 'High',
    nameJa: 'High',
    segments: [[1, 2]], // dec 89 -> altitude ~89° at the north pole
  }
  const MEDIUM: ConstellationRecord = {
    id: 'Medium',
    name: 'Medium',
    nameJa: 'Medium',
    segments: [[5, 5]], // dec 20 -> altitude 20°
  }
  const JUST_BELOW_THRESHOLD: ConstellationRecord = {
    id: 'JustBelowThreshold',
    name: 'JustBelowThreshold',
    nameJa: 'JustBelowThreshold',
    segments: [[4, 4]], // dec 3 -> altitude 3°
  }
  const BELOW_HORIZON: ConstellationRecord = {
    id: 'BelowHorizon',
    name: 'BelowHorizon',
    nameJa: 'BelowHorizon',
    segments: [[3, 3]], // dec -80 -> always below the horizon
  }

  it('ranks by current altitude, highest first', () => {
    const ranked = rankConstellationsByAltitude(
      [MEDIUM, HIGH],
      NORTH_POLE,
      ANY_DATE,
      0,
    )

    expect(ranked.map((c) => c.id)).toEqual(['High', 'Medium'])
  })

  it('drops constellations whose altitude is below the given threshold', () => {
    const ranked = rankConstellationsByAltitude(
      [HIGH, JUST_BELOW_THRESHOLD],
      NORTH_POLE,
      ANY_DATE,
      5,
    )

    expect(ranked.map((c) => c.id)).toEqual(['High'])
  })

  it('keeps a constellation right at the threshold with a lower threshold', () => {
    const ranked = rankConstellationsByAltitude(
      [JUST_BELOW_THRESHOLD],
      NORTH_POLE,
      ANY_DATE,
      0,
    )

    expect(ranked.map((c) => c.id)).toEqual(['JustBelowThreshold'])
  })

  it('drops constellations with no above-horizon segments regardless of threshold', () => {
    const ranked = rankConstellationsByAltitude(
      [BELOW_HORIZON],
      NORTH_POLE,
      ANY_DATE,
      -90,
    )

    expect(ranked).toEqual([])
  })
})

describe('computeConstellationEquatorialCenter', () => {
  it('averages segment stars in Cartesian space', () => {
    const center = computeConstellationEquatorialCenter({
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[6, 7]],
    })

    expect(center).not.toBeNull()
    expect(center?.raHours).toBeCloseTo(3, 5)
    expect(center?.decDegrees).toBeCloseTo(0, 5)
  })

  it('counts a star referenced by multiple segments only once', () => {
    const repeated = computeConstellationEquatorialCenter({
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      // Star 6 shows up 3 times (twice via a self-loop, once via the pair)
      // but must not out-weigh star 7 in the average.
      segments: [
        [6, 6],
        [6, 6],
        [6, 7],
      ],
    })
    const unique = computeConstellationEquatorialCenter({
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[6, 7]],
    })

    expect(repeated?.raHours).toBeCloseTo(unique?.raHours ?? NaN, 5)
    expect(repeated?.decDegrees).toBeCloseTo(unique?.decDegrees ?? NaN, 5)
  })

  it('returns null when no segment references a known star', () => {
    const center = computeConstellationEquatorialCenter({
      id: 'Test',
      name: 'Test',
      nameJa: 'テスト',
      segments: [[999, 998]],
    })

    expect(center).toBeNull()
  })
})

describe('findConstellationZenithLocation', () => {
  it('places the observer where the constellation center sits at zenith', () => {
    const location = findConstellationZenithLocation(
      {
        id: 'Test',
        name: 'Test',
        nameJa: 'テスト',
        segments: [[6, 7]],
      },
      ANY_DATE,
    )

    expect(location).not.toBeNull()
    // The center (RA 3h, dec 0) is at zenith only for a latitude-0 observer.
    expect(location?.latitudeDegrees).toBeCloseTo(0, 5)

    // That location should, in turn, actually see the constellation directly
    // overhead — an end-to-end check via the forward transform.
    const segments = computeConstellationLineSegments(
      {
        id: 'Test',
        name: 'Test',
        nameJa: 'テスト',
        segments: [[6, 7]],
      },
      location!,
      ANY_DATE,
    )
    const lookDirection = computeConstellationLookDirection(segments)
    expect(lookDirection?.altitudeDegrees).toBeCloseTo(90, 0)
  })

  it('returns null when the constellation has no resolvable center', () => {
    const location = findConstellationZenithLocation(
      {
        id: 'Test',
        name: 'Test',
        nameJa: 'テスト',
        segments: [[999, 998]],
      },
      ANY_DATE,
    )

    expect(location).toBeNull()
  })
})
