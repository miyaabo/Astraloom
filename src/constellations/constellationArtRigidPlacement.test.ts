import { describe, expect, it, vi } from 'vitest'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import type { ConstellationArtRecord } from './constellationArtTypes'

vi.mock('./constellationProjection', () => ({
  computeConstellationIllustrationData: () => ({
    constellationId: 'Ari',
    name: 'Aries',
    nameJa: 'おひつじ座',
    stars: [
      { id: 1, x: -1, y: 0, magnitude: 1 },
      { id: 2, x: 1, y: 0, magnitude: 1 },
      { id: 3, x: 0, y: 1, magnitude: 1 },
    ],
    lines: [],
  }),
  computeConstellationStarPositions: () => [
    { starId: 1, position: { x: -1, y: 0, z: -99.995 } },
    { starId: 2, position: { x: 1, y: 0, z: -99.995 } },
    { starId: 3, position: { x: 0, y: 1, z: -99.995 } },
  ],
}))

const { buildRigidConstellationArtMesh } =
  await import('./constellationArtRigidPlacement')

const RECORD: ConstellationArtRecord = {
  constellationId: 'Ari',
  constellationNames: ['Aries'],
  imageUrl: '/no-line/Aries_線なし.png',
  imageWidthPx: 100,
  imageHeightPx: 100,
  pixelBounds: { minX: 10, minY: 20, maxX: 90, maxY: 80 },
  anchors: [],
  imagePath: 'public/no-line/Aries_線なし.png',
  guideImagePath: 'tmp/constellation-guides/Ari.svg',
  offsetX: 4,
  offsetY: -3,
  scale: 0.75,
  rotationDeg: 15,
  flipX: false,
  flipY: false,
  guideBounds: { minX: 100, minY: 200, maxX: 900, maxY: 800 },
}

describe('constellation art rigid placement', () => {
  it('builds a single four-corner rigid plane on the live sky sphere', () => {
    const mesh = buildRigidConstellationArtMesh(
      { id: 'Ari', name: 'Aries', nameJa: 'おひつじ座', segments: [] },
      RECORD,
      { latitudeDegrees: 35, longitudeDegrees: 139 },
      new Date('2026-01-01T00:00:00Z'),
    )

    expect(mesh).not.toBeNull()
    expect(mesh?.positions).toHaveLength(12)
    expect(mesh?.uvs).toHaveLength(8)
    expect([...(mesh?.indices ?? [])]).toEqual([0, 2, 1, 1, 2, 3])
    for (let index = 0; index < (mesh?.positions.length ?? 0); index += 3) {
      const radius = Math.hypot(
        mesh?.positions[index] ?? 0,
        mesh?.positions[index + 1] ?? 0,
        mesh?.positions[index + 2] ?? 0,
      )
      expect(radius).toBeGreaterThanOrEqual(SKY_SPHERE_RADIUS)
    }
  })

  it('uses the same rigid placement for a non-zodiac record', () => {
    const mesh = buildRigidConstellationArtMesh(
      { id: 'Ori', name: 'Orion', nameJa: 'オリオン座', segments: [] },
      { ...RECORD, constellationId: 'Ori' },
      { latitudeDegrees: 35, longitudeDegrees: 139 },
      new Date('2026-01-01T00:00:00Z'),
    )
    expect(mesh).not.toBeNull()
  })
})
