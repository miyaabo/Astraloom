import {
  AstroTime,
  Body,
  Horizon,
  Illumination,
  Observer,
  type EquatorialCoordinates as AstronomyEquatorialCoordinates,
  type HorizontalCoordinates as AstronomyHorizontalCoordinates,
  type IlluminationInfo as AstronomyIlluminationInfo,
} from 'astronomy-engine'
import type {
  CelestialBodyEquatorialCoordinates,
  CelestialBodyHorizontalCoordinates,
  SupportedCelestialBodyId,
} from './celestialBodyTypes'
import type { ObserverLocation } from '../astronomy/coordinates'

const BODY_ID_TO_ASTRONOMY_BODY: Readonly<Record<SupportedCelestialBodyId, Body>> = {
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
}

export function toAstronomyEngineBody(id: SupportedCelestialBodyId): Body {
  return BODY_ID_TO_ASTRONOMY_BODY[id]
}

export function createAstronomyObserver(
  location: ObserverLocation,
  heightMeters = 0,
): Observer {
  return new Observer(
    location.latitudeDegrees,
    location.longitudeDegrees,
    heightMeters,
  )
}

export function createAstronomyTime(date: Date): AstroTime {
  return new AstroTime(date)
}

export function toCelestialBodyEquatorialCoordinates(
  coordinates: AstronomyEquatorialCoordinates,
): CelestialBodyEquatorialCoordinates {
  return {
    raHours: coordinates.ra,
    decDegrees: coordinates.dec,
  }
}

export function toCelestialBodyHorizontalCoordinates(
  coordinates: AstronomyHorizontalCoordinates,
): CelestialBodyHorizontalCoordinates {
  return {
    azimuthDegrees: coordinates.azimuth,
    altitudeDegrees: coordinates.altitude,
  }
}

export function toIlluminatedFraction(
  illumination: AstronomyIlluminationInfo,
): number {
  return illumination.phase_fraction
}

/**
 * Small end-to-end adapter smoke check for Task 3: proves the dependency is
 * callable from Veluna and converts one horizontal-coordinate result through
 * the local boundary types. Task 4/5 build the real body calculations on top.
 */
export function createAstronomyEngineSmokeSample(
  date: Date,
  location: ObserverLocation,
): {
  time: AstroTime
  observer: Observer
  horizon: CelestialBodyHorizontalCoordinates
  illuminatedFraction: number
} {
  const time = createAstronomyTime(date)
  const observer = createAstronomyObserver(location)
  const horizon = Horizon(date, observer, 0, 0, 'normal')
  const illumination = Illumination(Body.Moon, date)

  return {
    time,
    observer,
    horizon: toCelestialBodyHorizontalCoordinates(horizon),
    illuminatedFraction: toIlluminatedFraction(illumination),
  }
}
