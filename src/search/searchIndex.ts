import {
  createCelestialBodySearchRecords,
  type CelestialBodySearchRecord,
} from '../celestialBodies/celestialBodyTypes'
import { loadConstellationCatalog } from '../constellations/constellationCatalogSource'
import type { ConstellationRecord } from '../constellations/constellationTypes'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import { toDisplayStarName } from '../stars/starNameJa'
import type { HygStarRecord } from '../stars/starTypes'

export interface ConstellationSearchResult {
  type: 'constellation'
  constellation: ConstellationRecord
}

export interface StarSearchResult {
  type: 'star'
  star: HygStarRecord
  /** Guaranteed non-null: only proper-named stars are indexed (see buildEntries). */
  properName: string
}

export interface CelestialBodySearchResult {
  type: 'celestialBody'
  celestialBody: CelestialBodySearchRecord
}

export type SearchResult =
  | ConstellationSearchResult
  | CelestialBodySearchResult
  | StarSearchResult

interface SearchEntry {
  result: SearchResult
  /** Lowercased English + Japanese name text to match the query against. */
  searchText: string
}

let cachedEntries: SearchEntry[] | null = null

function buildEntries(): SearchEntry[] {
  const entries: SearchEntry[] = []

  for (const constellation of loadConstellationCatalog()) {
    entries.push({
      result: { type: 'constellation', constellation },
      searchText: `${constellation.name} ${constellation.nameJa}`.toLowerCase(),
    })
  }

  for (const celestialBody of createCelestialBodySearchRecords()) {
    entries.push({
      result: { type: 'celestialBody', celestialBody },
      searchText: celestialBody.searchText,
    })
  }

  // Only proper-named stars are searchable by name — matches how Task 4's
  // labels and Task 5's info panel already treat unnamed stars ("名前のない星").
  for (const star of loadHygStarCatalog()) {
    if (!star.properName) continue
    entries.push({
      result: { type: 'star', star, properName: star.properName },
      searchText: toDisplayStarName(star.properName).toLowerCase(),
    })
  }

  return entries
}

const MAX_RESULTS = 20
const MAX_CONSTELLATION_RESULTS = 8
const MAX_CELESTIAL_BODY_RESULTS = 6
const MAX_STAR_RESULTS = 6

/**
 * Simple substring matching over constellation/star names (Task 6;
 * phase-3-star-knowledge.md rules out a full-text search engine for this
 * scope). Matches both English and Japanese names, since each indexed
 * entry's searchText folds in a constellation's name/nameJa or a star's
 * "英名 (和名)" display pairing (toDisplayStarName). An empty/whitespace-only
 * query returns no results.
 */
export function searchCatalog(query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length === 0) return []

  if (cachedEntries === null) cachedEntries = buildEntries()

  const constellationMatches: SearchResult[] = []
  const celestialBodyMatches: SearchResult[] = []
  const starMatches: SearchResult[] = []
  for (const entry of cachedEntries) {
    if (!entry.searchText.includes(trimmed)) continue
    if (entry.result.type === 'constellation') {
      constellationMatches.push(entry.result)
    } else if (entry.result.type === 'celestialBody') {
      celestialBodyMatches.push(entry.result)
    } else {
      starMatches.push(entry.result)
    }
  }

  // Results are grouped by meaning rather than a single global match order:
  // all constellations are indexed before celestial bodies and stars, so a
  // broad query would otherwise let the first category crowd out the rest.
  const constellationCount = Math.min(
    constellationMatches.length,
    MAX_CONSTELLATION_RESULTS,
  )
  const celestialBodyCount = Math.min(
    celestialBodyMatches.length,
    MAX_CELESTIAL_BODY_RESULTS,
  )
  const remainingBudget =
    MAX_RESULTS - constellationCount - celestialBodyCount
  const starCount = Math.min(
    starMatches.length,
    Math.min(MAX_STAR_RESULTS, remainingBudget),
  )

  return [
    ...constellationMatches.slice(0, constellationCount),
    ...celestialBodyMatches.slice(0, celestialBodyCount),
    ...starMatches.slice(0, starCount),
  ]
}

/** Display label for one search result, matching how its name already appears elsewhere (constellation name labels, StarInfoOverlay). */
export function searchResultDisplayName(result: SearchResult): string {
  if (result.type === 'constellation') {
    return `${result.constellation.name} (${result.constellation.nameJa})`
  }

  if (result.type === 'celestialBody') {
    return `${result.celestialBody.displayName} (${result.celestialBody.displayNameJa})`
  }

  return toDisplayStarName(result.properName)
}
