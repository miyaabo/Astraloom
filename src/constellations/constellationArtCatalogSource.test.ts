import { describe, expect, it, vi } from 'vitest'

const VALID_IMAGE_FIELDS = {
  imageUrl: '/no-line/test.png',
  imageWidthPx: 1000,
  imageHeightPx: 800,
  pixelBounds: { minX: 100, minY: 100, maxX: 900, maxY: 700 },
  imagePath: 'public/no-line/test.png',
  guideImagePath: 'tmp/constellation-guides/Test.svg',
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotationDeg: 0,
  flipX: false,
  flipY: false,
  guideBounds: { minX: 100, minY: 100, maxX: 900, maxY: 700 },
}

const FIXTURE_RECORDS = [
  {
    constellationId: 'Ori',
    constellationNames: ['Orion'],
    ...VALID_IMAGE_FIELDS,
    anchors: [
      { starId: 1, pixelX: 100, pixelY: 400 },
      { starId: 2, pixelX: 400, pixelY: 400 },
    ],
  },
  {
    constellationId: 'Car',
    constellationNames: ['Carina', 'Puppis', 'Vela'],
    ...VALID_IMAGE_FIELDS,
    anchors: [
      { starId: 3, pixelX: 250, pixelY: 100 },
      { starId: 4, pixelX: 250, pixelY: 300 },
    ],
  },
  // Invalid shapes the loader should silently filter out rather than throw on.
  {
    constellationId: 'InvalidNames',
    constellationNames: [],
    ...VALID_IMAGE_FIELDS,
    anchors: [{ starId: 5, pixelX: 0, pixelY: 0 }],
  },
  {
    constellationId: 'InvalidScale',
    constellationNames: ['Xyz'],
    ...VALID_IMAGE_FIELDS,
    scale: 0,
    anchors: [],
  },
  {
    constellationId: 'InvalidAnchor',
    constellationNames: ['Xyz'],
    ...VALID_IMAGE_FIELDS,
    anchors: [{ starId: 'nope', pixelX: 0, pixelY: 0 }],
  },
  // Missing image fields should also be filtered out.
  {
    constellationId: 'Missing',
    constellationNames: ['Missing'],
    anchors: [{ starId: 6, pixelX: 0, pixelY: 0 }],
  },
]

vi.mock('./data/constellationArt.json', () => ({ default: FIXTURE_RECORDS }))

const { findConstellationArtByConstellationName, loadConstellationArtCatalog } =
  await import('./constellationArtCatalogSource')

describe('loadConstellationArtCatalog', () => {
  it('keeps only records with a non-empty name, valid rigid placement, and valid optional anchors', async () => {
    const records = await loadConstellationArtCatalog()
    expect(records).toHaveLength(2)
    expect(records.map((r) => r.constellationNames)).toEqual([
      ['Orion'],
      ['Carina', 'Puppis', 'Vela'],
    ])
  })
})

describe('findConstellationArtByConstellationName', () => {
  it('finds a record for a known constellation', async () => {
    const record = await findConstellationArtByConstellationName('Orion')
    expect(record?.constellationNames).toEqual(['Orion'])
  })

  it('resolves a shared-record constellation name to that same record', async () => {
    const forCarina = await findConstellationArtByConstellationName('Carina')
    const forVela = await findConstellationArtByConstellationName('Vela')
    expect(forCarina).not.toBeNull()
    expect(forVela).toBe(forCarina)
  })

  it('returns null for a name with no art record', async () => {
    await expect(
      findConstellationArtByConstellationName('Serpens Caput'),
    ).resolves.toBeNull()
  })

  it('returns null for an unknown name', async () => {
    await expect(
      findConstellationArtByConstellationName('Xyz'),
    ).resolves.toBeNull()
  })
})
