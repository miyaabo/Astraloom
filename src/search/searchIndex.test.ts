import { describe, expect, it } from 'vitest'
import { loadConstellationCatalog } from '../constellations/constellationCatalogSource'
import { toDisplayStarName } from '../stars/starNameJa'
import { searchCatalog, searchResultDisplayName } from './searchIndex'

describe('searchCatalog', () => {
  it('returns no results for an empty or whitespace-only query', () => {
    expect(searchCatalog('')).toEqual([])
    expect(searchCatalog('   ')).toEqual([])
  })

  it('matches a constellation by its English name, case-insensitively', () => {
    const results = searchCatalog('oRiOn')
    expect(
      results.some(
        (r) => r.type === 'constellation' && r.constellation.id === 'Ori',
      ),
    ).toBe(true)
  })

  it('matches a constellation by its Japanese name', () => {
    const orion = loadConstellationCatalog().find((c) => c.id === 'Ori')!
    const results = searchCatalog(orion.nameJa)
    expect(
      results.some(
        (r) => r.type === 'constellation' && r.constellation.id === 'Ori',
      ),
    ).toBe(true)
  })

  it('matches a star by its English proper name', () => {
    const results = searchCatalog('altair')
    expect(
      results.some((r) => r.type === 'star' && r.properName === 'Altair'),
    ).toBe(true)
  })

  it('matches a star by its curated Japanese name', () => {
    const results = searchCatalog('アルタイル')
    expect(
      results.some((r) => r.type === 'star' && r.properName === 'Altair'),
    ).toBe(true)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchCatalog('xyznonexistentquery')).toEqual([])
  })

  it('still surfaces star matches for a broad query that alone matches 20+ constellations', () => {
    // All 89 constellations are indexed before any star (see buildEntries),
    // so a single common letter matches far more than MAX_RESULTS
    // constellations on its own — a shared cap would exhaust the result
    // budget before ever checking a star.
    const results = searchCatalog('a')
    expect(
      results.filter((r) => r.type === 'constellation').length,
    ).toBeGreaterThan(0)
    expect(results.filter((r) => r.type === 'star').length).toBeGreaterThan(0)
  })
})

describe('searchResultDisplayName', () => {
  it('pairs a constellation English/Japanese names, matching its own name/nameJa', () => {
    const orion = loadConstellationCatalog().find((c) => c.id === 'Ori')!
    const [result] = searchCatalog('orion').filter(
      (r) => r.type === 'constellation' && r.constellation.id === 'Ori',
    )
    expect(searchResultDisplayName(result)).toBe(
      `${orion.name} (${orion.nameJa})`,
    )
  })

  it("matches a star's own toDisplayStarName pairing", () => {
    const [result] = searchCatalog('altair').filter(
      (r) => r.type === 'star' && r.properName === 'Altair',
    )
    expect(searchResultDisplayName(result)).toBe(toDisplayStarName('Altair'))
  })
})
