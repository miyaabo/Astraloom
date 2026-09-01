import { Equator, Horizon, Illumination } from 'astronomy-engine'
import type { ObserverLocation } from '../astronomy/coordinates'
import {
  createAstronomyObserver,
  toAstronomyEngineBody,
  toCelestialBodyEquatorialCoordinates,
  toCelestialBodyHorizontalCoordinates,
  toIlluminatedFraction,
} from './astronomyEngineAdapter'
import {
  findCelestialBodyDefinition,
  supportedPlanetIds,
  type CelestialBodyState,
} from './celestialBodyTypes'

export function calculatePlanetStates(
  location: ObserverLocation,
  date: Date,
): CelestialBodyState[] {
  const observer = createAstronomyObserver(location)

  return supportedPlanetIds.map((id) => {
    const body = toAstronomyEngineBody(id)
    const equatorial = Equator(body, date, observer, true, true)
    const horizontal = Horizon(
      date,
      observer,
      equatorial.ra,
      equatorial.dec,
      'normal',
    )
    const illumination = Illumination(body, date)
    const definition = findCelestialBodyDefinition(id)

    return {
      id,
      kind: definition.kind,
      horizontal: toCelestialBodyHorizontalCoordinates(horizontal),
      equatorial: toCelestialBodyEquatorialCoordinates(equatorial),
      distanceAu: equatorial.dist,
      apparentMagnitude: illumination.mag,
      illuminatedFraction: toIlluminatedFraction(illumination),
    }
  })
}
