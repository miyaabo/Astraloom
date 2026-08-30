import { describe, expect, it } from 'vitest'
import { findConstellationTrivia } from './constellationTrivia'
import { loadConstellationCatalog } from './constellationCatalogSource'

describe('findConstellationTrivia', () => {
  it('returns a non-empty trivia string for every constellation in the bundled catalog', () => {
    for (const constellation of loadConstellationCatalog()) {
      const trivia = findConstellationTrivia(constellation.name)
      expect(trivia, `missing trivia for ${constellation.name}`).not.toBeNull()
      expect(trivia?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('returns null for an unknown name', () => {
    expect(findConstellationTrivia('Not A Constellation')).toBeNull()
  })
})
