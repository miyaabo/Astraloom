import type { StarPosition } from '../stars/starTypes'

export const supportedCelestialBodyIds = [
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
] as const

export const supportedPlanetIds = [
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
] as const

export type SupportedCelestialBodyId = (typeof supportedCelestialBodyIds)[number]
export type SupportedPlanetId = (typeof supportedPlanetIds)[number]

export type CelestialBodyKind = 'moon' | 'planet'

export type CelestialBodyVisualClass =
  | 'moon'
  | 'neutral'
  | 'warm'
  | 'cool'

export interface CelestialBodyDefinition {
  id: SupportedCelestialBodyId
  kind: CelestialBodyKind
  displayName: string
  displayNameJa: string
  searchAliases: readonly string[]
  visualClass: CelestialBodyVisualClass
}

export interface CelestialBodyHorizontalCoordinates {
  azimuthDegrees: number
  altitudeDegrees: number
}

export interface CelestialBodyEquatorialCoordinates {
  raHours: number
  decDegrees: number
}

/**
 * Runtime state produced by the astronomy layer before any renderer/search/UI
 * adaptation. Keeps sky coordinates and a few body-specific physical values,
 * but nothing about how the body should be drawn or displayed in overlays.
 */
export interface CelestialBodyState {
  id: SupportedCelestialBodyId
  kind: CelestialBodyKind
  horizontal: CelestialBodyHorizontalCoordinates
  equatorial: CelestialBodyEquatorialCoordinates
  distanceAu: number
  apparentMagnitude: number | null
  illuminatedFraction: number | null
  phaseAngleDegrees?: number
}

/**
 * Render-layer input derived from CelestialBodyState. Separate from the
 * astronomy state so visual tuning can change without touching ephemeris
 * calculations.
 */
export interface CelestialBodyRenderData {
  id: SupportedCelestialBodyId
  kind: CelestialBodyKind
  position: StarPosition
  visualClass: CelestialBodyVisualClass
  brightness: number
  sizeScale: number
}

/**
 * Search-layer input derived from static body definitions. Keeps only naming
 * metadata so search indexing stays independent from runtime position updates.
 */
export interface CelestialBodySearchRecord {
  id: SupportedCelestialBodyId
  kind: CelestialBodyKind
  displayName: string
  displayNameJa: string
  searchText: string
}

const BODY_DEFINITIONS: Readonly<Record<SupportedCelestialBodyId, CelestialBodyDefinition>> = {
  moon: {
    id: 'moon',
    kind: 'moon',
    displayName: 'Moon',
    displayNameJa: '月',
    searchAliases: ['Luna', 'Moon', '月', 'つき'],
    visualClass: 'moon',
  },
  mercury: {
    id: 'mercury',
    kind: 'planet',
    displayName: 'Mercury',
    displayNameJa: '水星',
    searchAliases: ['Mercury', '水星', 'すいせい'],
    visualClass: 'neutral',
  },
  venus: {
    id: 'venus',
    kind: 'planet',
    displayName: 'Venus',
    displayNameJa: '金星',
    searchAliases: ['Venus', '金星', 'きんせい'],
    visualClass: 'warm',
  },
  mars: {
    id: 'mars',
    kind: 'planet',
    displayName: 'Mars',
    displayNameJa: '火星',
    searchAliases: ['Mars', '火星', 'かせい'],
    visualClass: 'warm',
  },
  jupiter: {
    id: 'jupiter',
    kind: 'planet',
    displayName: 'Jupiter',
    displayNameJa: '木星',
    searchAliases: ['Jupiter', '木星', 'もくせい'],
    visualClass: 'neutral',
  },
  saturn: {
    id: 'saturn',
    kind: 'planet',
    displayName: 'Saturn',
    displayNameJa: '土星',
    searchAliases: ['Saturn', '土星', 'どせい'],
    visualClass: 'cool',
  },
}

export function loadCelestialBodyDefinitions(): CelestialBodyDefinition[] {
  return supportedCelestialBodyIds.map((id) => BODY_DEFINITIONS[id])
}

export function findCelestialBodyDefinition(
  id: SupportedCelestialBodyId,
): CelestialBodyDefinition {
  return BODY_DEFINITIONS[id]
}

export function createCelestialBodySearchRecords(): CelestialBodySearchRecord[] {
  return loadCelestialBodyDefinitions().map((body) => ({
    id: body.id,
    kind: body.kind,
    displayName: body.displayName,
    displayNameJa: body.displayNameJa,
    searchText: `${body.displayName} ${body.displayNameJa} ${body.searchAliases.join(' ')}`.toLowerCase(),
  }))
}
