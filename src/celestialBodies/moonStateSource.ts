import { Body, Equator, Horizon, Illumination, MoonPhase } from 'astronomy-engine'
import type { ObserverLocation } from '../astronomy/coordinates'
import {
  createAstronomyObserver,
  toCelestialBodyEquatorialCoordinates,
  toCelestialBodyHorizontalCoordinates,
  toIlluminatedFraction,
} from './astronomyEngineAdapter'
import type { CelestialBodyState } from './celestialBodyTypes'

export interface MoonState extends CelestialBodyState {
  id: 'moon'
  kind: 'moon'
  moonPhaseDegrees: number
}

export function calculateMoonState(
  location: ObserverLocation,
  date: Date,
): MoonState {
  const observer = createAstronomyObserver(location)
  const equatorial = Equator(Body.Moon, date, observer, true, true)
  const horizontal = Horizon(date, observer, equatorial.ra, equatorial.dec, 'normal')
  const illumination = Illumination(Body.Moon, date)
  return {
    id: 'moon',
    kind: 'moon',
    horizontal: toCelestialBodyHorizontalCoordinates(horizontal),
    equatorial: toCelestialBodyEquatorialCoordinates(equatorial),
    distanceAu: equatorial.dist,
    apparentMagnitude: illumination.mag,
    illuminatedFraction: toIlluminatedFraction(illumination),
    phaseAngleDegrees: illumination.phase_angle,
    moonPhaseDegrees: MoonPhase(date),
  }
}
