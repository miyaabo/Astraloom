import { describe, expect, it, vi } from 'vitest'
import type { HygStarRecord } from '../stars/starTypes'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import type { ConstellationArtRecord } from './constellationArtTypes'

const FIXTURE_STARS: HygStarRecord[] = [
  // Overhead for a north-pole observer at RA 0h (visible any time).
  {
    id: 1,
    raHours: 0,
    decDegrees: 89,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  {
    id: 2,
    raHours: 6,
    decDegrees: 89,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  {
    id: 3,
    raHours: 12,
    decDegrees: 89,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
  // Far south of a north-pole observer's horizon, always below it.
  {
    id: 4,
    raHours: 0,
    decDegrees: -80,
    magnitude: 1,
    colorIndex: 0,
    properName: null,
  },
]

const FIXTURE_RECORD: ConstellationArtRecord = {
  constellationIds: ['Test'],
  anchors: [
    { starId: 1, pixelX: 100, pixelY: 400 },
    { starId: 2, pixelX: 400, pixelY: 400 },
    { starId: 3, pixelX: 250, pixelY: 100 },
  ],
}

vi.mock('../stars/hygCatalogSource', () => ({
  loadHygStarCatalog: () => FIXTURE_STARS,
}))

const mockFindArt =
  vi.fn<(id: string) => Promise<ConstellationArtRecord | null>>()
vi.mock('./constellationArtCatalogSource', () => ({
  findConstellationArtByConstellationId: (id: string) => mockFindArt(id),
}))

const { computeConstellationArtPlacement } =
  await import('./constellationArtProjection')

const NORTH_POLE = { latitudeDegrees: 90, longitudeDegrees: 0 }
const ANY_DATE = new Date('2026-01-01T00:00:00Z')

describe('computeConstellationArtPlacement', () => {
  it('returns null when the constellation has no art record', async () => {
    mockFindArt.mockResolvedValue(null)

    await expect(
      computeConstellationArtPlacement('Ser', NORTH_POLE, ANY_DATE),
    ).resolves.toBeNull()
  })

  it('projects all above-horizon anchors onto the sky sphere', async () => {
    mockFindArt.mockResolvedValue(FIXTURE_RECORD)

    const placement = await computeConstellationArtPlacement(
      'Test',
      NORTH_POLE,
      ANY_DATE,
    )

    expect(placement).not.toBeNull()
    expect(placement?.anchors).toHaveLength(3)
    for (const anchor of placement?.anchors ?? []) {
      const radius = Math.hypot(
        anchor.position.x,
        anchor.position.y,
        anchor.position.z,
      )
      expect(radius).toBeCloseTo(SKY_SPHERE_RADIUS, 5)
    }
  })

  it('drops below-horizon anchors, keeping the placement if 2+ remain', async () => {
    mockFindArt.mockResolvedValue({
      ...FIXTURE_RECORD,
      anchors: [
        { starId: 1, pixelX: 100, pixelY: 400 },
        { starId: 2, pixelX: 400, pixelY: 400 },
        { starId: 4, pixelX: 250, pixelY: 100 }, // below horizon at NORTH_POLE
      ],
    })

    const placement = await computeConstellationArtPlacement(
      'Test',
      NORTH_POLE,
      ANY_DATE,
    )

    expect(placement?.anchors).toHaveLength(2)
  })

  it('returns null when fewer than 2 anchors are above the horizon', async () => {
    mockFindArt.mockResolvedValue({
      ...FIXTURE_RECORD,
      anchors: [
        { starId: 1, pixelX: 100, pixelY: 400 },
        { starId: 4, pixelX: 400, pixelY: 400 },
        { starId: 4, pixelX: 250, pixelY: 100 },
      ],
    })

    await expect(
      computeConstellationArtPlacement('Test', NORTH_POLE, ANY_DATE),
    ).resolves.toBeNull()
  })

  it('ignores anchors referencing unknown star ids', async () => {
    mockFindArt.mockResolvedValue({
      ...FIXTURE_RECORD,
      anchors: [
        { starId: 1, pixelX: 100, pixelY: 400 },
        { starId: 2, pixelX: 400, pixelY: 400 },
        { starId: 999, pixelX: 250, pixelY: 100 },
      ],
    })

    const placement = await computeConstellationArtPlacement(
      'Test',
      NORTH_POLE,
      ANY_DATE,
    )

    expect(placement?.anchors).toHaveLength(2)
  })
})
