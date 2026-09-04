import { describe, expect, it, vi } from 'vitest'

const FIXTURE_RECORDS = [
  {
    constellationIds: ['Ori'],
    anchors: [
      { starId: 1, pixelX: 100, pixelY: 400 },
      { starId: 2, pixelX: 400, pixelY: 400 },
    ],
  },
  {
    constellationIds: ['Car', 'Pup', 'Vel'],
    anchors: [
      { starId: 3, pixelX: 250, pixelY: 100 },
      { starId: 4, pixelX: 250, pixelY: 300 },
    ],
  },
  // Invalid shapes the loader should silently filter out rather than throw on.
  { constellationIds: [], anchors: [{ starId: 5, pixelX: 0, pixelY: 0 }] },
  { constellationIds: ['Xyz'], anchors: [] },
  { constellationIds: ['Xyz'], anchors: [{ starId: 'nope', pixelX: 0, pixelY: 0 }] },
]

vi.mock('./data/constellationArt.json', () => ({ default: FIXTURE_RECORDS }))

const { findConstellationArtByConstellationId, loadConstellationArtCatalog } =
  await import('./constellationArtCatalogSource')

describe('loadConstellationArtCatalog', () => {
  it('keeps only records with a non-empty constellationIds and valid anchors', async () => {
    const records = await loadConstellationArtCatalog()
    expect(records).toHaveLength(2)
    expect(records.map((r) => r.constellationIds)).toEqual([
      ['Ori'],
      ['Car', 'Pup', 'Vel'],
    ])
  })
})

describe('findConstellationArtByConstellationId', () => {
  it('finds a record for a known constellation', async () => {
    const record = await findConstellationArtByConstellationId('Ori')
    expect(record?.constellationIds).toEqual(['Ori'])
  })

  it('resolves a shared-record constellation id to that same record', async () => {
    const forCarina = await findConstellationArtByConstellationId('Car')
    const forVela = await findConstellationArtByConstellationId('Vel')
    expect(forCarina).not.toBeNull()
    expect(forVela).toBe(forCarina)
  })

  it('returns null for an id with no art record', async () => {
    await expect(
      findConstellationArtByConstellationId('Ser'),
    ).resolves.toBeNull()
  })

  it('returns null for an unknown id', async () => {
    await expect(
      findConstellationArtByConstellationId('Xyz'),
    ).resolves.toBeNull()
  })
})
