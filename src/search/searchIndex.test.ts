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

  it('matches a celestial body by its English name', () => {
    const results = searchCatalog('jupiter')
    expect(
      results.some(
        (r) =>
          r.type === 'celestialBody' && r.celestialBody.id === 'jupiter',
      ),
    ).toBe(true)
  })

  it('matches a celestial body by its Japanese name', () => {
    const results = searchCatalog('月')
    expect(
      results.some((r) => r.type === 'celestialBody' && r.celestialBody.id === 'moon'),
    ).toBe(true)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchCatalog('xyznonexistentquery')).toEqual([])
  })

  it('still surfaces celestial-body and star matches for a broad query that alone matches many constellations', () => {
    // All 89 constellations are indexed before any star (see buildEntries),
    // and celestial bodies sit before stars, so a single common letter could
    // otherwise let earlier categories crowd out later ones under one cap.
    const results = searchCatalog('a')
    expect(
      results.filter((r) => r.type === 'constellation').length,
    ).toBeGreaterThan(0)
    expect(
      results.filter((r) => r.type === 'celestialBody').length,
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

  it('pairs a celestial body English/Japanese names from its static metadata', () => {
    const [result] = searchCatalog('venus').filter(
      (r) => r.type === 'celestialBody' && r.celestialBody.id === 'venus',
    )
    expect(searchResultDisplayName(result)).toBe('Venus (金星)')
  })
})
