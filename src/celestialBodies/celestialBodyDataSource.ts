import type { ObserverLocation } from '../astronomy/coordinates'
import { createCelestialBodyRenderDataList } from './celestialBodyRenderData'
import { calculateMoonState } from './moonStateSource'
import { calculatePlanetStates } from './planetStateSource'
import type { CelestialBodyRenderData } from './celestialBodyTypes'

export function generateCelestialBodyRenderData(
  location: ObserverLocation,
  date: Date,
): CelestialBodyRenderData[] {
  return createCelestialBodyRenderDataList([
    calculateMoonState(location, date),
    ...calculatePlanetStates(location, date),
  ])
}
