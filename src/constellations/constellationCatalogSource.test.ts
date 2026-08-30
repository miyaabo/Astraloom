import { describe, expect, it } from 'vitest'
import {
  findConstellationByStarId,
  loadConstellationCatalog,
} from './constellationCatalogSource'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'

describe('loadConstellationCatalog', () => {
  const constellations = loadConstellationCatalog()
  const starIds = new Set(loadHygStarCatalog().map((star) => star.id))

  it('covers the IAU 88 constellations (89 features; Serpens splits into Caput/Cauda, D015)', () => {
    expect(constellations.length).toBe(89)
    const uniqueIds = new Set(constellations.map((c) => c.id))
    expect(uniqueIds.size).toBe(88)
  })

  it('gives every constellation a non-empty name (en/ja) and at least one line segment', () => {
    for (const constellation of constellations) {
      expect(constellation.name.length).toBeGreaterThan(0)
      expect(constellation.nameJa.length).toBeGreaterThan(0)
      expect(constellation.segments.length).toBeGreaterThan(0)
    }
  })

  it('only references star ids present in the bundled HYG catalog', () => {
    for (const constellation of constellations) {
      for (const [a, b] of constellation.segments) {
        expect(starIds.has(a)).toBe(true)
        expect(starIds.has(b)).toBe(true)
      }
    }
  })

  it('never links a star to itself', () => {
    for (const constellation of constellations) {
      for (const [a, b] of constellation.segments) {
        expect(a).not.toBe(b)
      }
    }
  })

  it('includes well-known constellations (Orion, Ursa Major)', () => {
    const ids = new Set(constellations.map((c) => c.id))
    expect(ids.has('Ori')).toBe(true)
    expect(ids.has('UMa')).toBe(true)
  })
})

describe('findConstellationByStarId', () => {
  it('finds the constellation containing a given segment star id', () => {
    const [constellation] = loadConstellationCatalog()
    const [starId] = constellation.segments[0]

    expect(findConstellationByStarId(starId)?.id).toBe(constellation.id)
  })

  it('returns null for a star id that is not part of any constellation segment', () => {
    const catalogStarIds = loadHygStarCatalog().map((star) => star.id)
    const referencedIds = new Set(
      loadConstellationCatalog().flatMap((c) => c.segments.flat()),
    )
    const unreferencedId = catalogStarIds.find((id) => !referencedIds.has(id))

    expect(unreferencedId).toBeDefined()
    expect(findConstellationByStarId(unreferencedId as number)).toBeNull()
  })
})
