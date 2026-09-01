import {
  createCelestialBodySearchRecords,
  type CelestialBodySearchRecord,
} from '../celestialBodies/celestialBodyTypes'
import { loadConstellationCatalog } from '../constellations/constellationCatalogSource'
import type { ConstellationRecord } from '../constellations/constellationTypes'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import { toDisplayStarName } from '../stars/starNameJa'
import type { HygStarRecord } from '../stars/starTypes'

interface CelestialBodySelectionOption {
  type: 'celestialBody'
  value: string
  label: string
  celestialBody: CelestialBodySearchRecord
}

interface ConstellationSelectionOption {
  type: 'constellation'
  value: string
  label: string
  constellation: ConstellationRecord
}

interface StarSelectionOption {
  type: 'star'
  value: string
  label: string
  star: HygStarRecord
}

export type SelectionOption =
  | CelestialBodySelectionOption
  | ConstellationSelectionOption
  | StarSelectionOption

let cachedOptions: SelectionOption[] | null = null

export function buildSelectionOptions(): SelectionOption[] {
  if (cachedOptions) return cachedOptions

  const celestialBodies: SelectionOption[] = createCelestialBodySearchRecords().map(
    (celestialBody) => ({
      type: 'celestialBody',
      value: `celestial-${celestialBody.id}`,
      label: `${celestialBody.displayName} (${celestialBody.displayNameJa})`,
      celestialBody,
    }),
  )

  const constellations: SelectionOption[] = loadConstellationCatalog()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((constellation) => ({
      type: 'constellation',
      value: `constellation-${constellation.name}`,
      label: `${constellation.name} (${constellation.nameJa})`,
      constellation,
    }))

  const stars: SelectionOption[] = loadHygStarCatalog()
    .filter((star) => star.properName)
    .slice()
    .sort((a, b) => a.properName!.localeCompare(b.properName!))
    .map((star) => ({
      type: 'star',
      value: `star-${star.id}`,
      label: toDisplayStarName(star.properName!),
      star,
    }))

  cachedOptions = [...celestialBodies, ...constellations, ...stars]
  return cachedOptions
}
