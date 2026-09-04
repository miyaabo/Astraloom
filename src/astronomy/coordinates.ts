/**
 * Spherical astronomy: sidereal time and equatorial→horizontal coordinate
 * conversion. Self-implemented from the standard formulas in Meeus,
 * "Astronomical Algorithms" (2nd ed.), ch. 12–13, rather than adding a
 * library dependency — the math is small, stable, and precise enough for
 * this app's needs (see docs/features/phase-1-implementation-tasks.md Task 3).
 *
 * Deliberately knows nothing about star data (src/stars) or rendering
 * (src/render) — see D003 and PRODUCT.md's placement/appearance split.
 */

import { DEG_TO_RAD, RAD_TO_DEG, clamp, normalizeDegrees } from '../mathUtils'

export interface ObserverLocation {
  latitudeDegrees: number
  /** East-positive, matching typical longitude convention (e.g. Tokyo ≈ +139.7). */
  longitudeDegrees: number
}

export interface EquatorialCoordinates {
  raHours: number
  decDegrees: number
}

export interface HorizontalCoordinates {
  /** Degrees above the horizon; negative when the object is below it. */
  altitudeDegrees: number
  /** Degrees clockwise from north (0 = N, 90 = E, 180 = S, 270 = W). */
  azimuthDegrees: number
}

const MS_PER_DAY = 86400000
const UNIX_EPOCH_JULIAN_DATE = 2440587.5

function toJulianDate(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JULIAN_DATE
}

/**
 * Greenwich Mean Sidereal Time, in degrees [0, 360).
 * Meeus (2nd ed.) formula 12.4. Anchored to GMST = 280.46061837deg at the
 * J2000.0 epoch (2000-01-01T12:00:00Z), the standard IAU reference value.
 */
export function greenwichMeanSiderealTimeDegrees(date: Date): number {
  const jd = toJulianDate(date)
  const centuriesSinceJ2000 = (jd - 2451545.0) / 36525
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * centuriesSinceJ2000 ** 2 -
    centuriesSinceJ2000 ** 3 / 38710000
  return normalizeDegrees(gmst)
}

export function localSiderealTimeDegrees(
  date: Date,
  longitudeDegrees: number,
): number {
  return normalizeDegrees(
    greenwichMeanSiderealTimeDegrees(date) + longitudeDegrees,
  )
}

/**
 * Converts declination + hour angle to horizontal coordinates for an
 * observer latitude. Split out from `equatorialToHorizontal` so the
 * angle-only spherical trig (the convention-sensitive, easy-to-get-wrong
 * part) can be unit tested with exact expected values, independent of
 * sidereal time/date handling.
 */
export function equatorialToHorizontalAtHourAngle(
  decDegrees: number,
  hourAngleDegrees: number,
  latitudeDegrees: number,
): HorizontalCoordinates {
  const hourAngleRad = normalizeDegrees(hourAngleDegrees) * DEG_TO_RAD
  const decRad = decDegrees * DEG_TO_RAD
  const latRad = latitudeDegrees * DEG_TO_RAD

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngleRad)
  const altRad = Math.asin(clamp(sinAlt, -1, 1))
  const cosAlt = Math.cos(altRad)

  if (cosAlt < 1e-9) {
    // Object at zenith/nadir: azimuth is undefined. 0 is as good as any value.
    return { altitudeDegrees: altRad * RAD_TO_DEG, azimuthDegrees: 0 }
  }

  const cosAz =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (cosAlt * Math.cos(latRad))
  let azimuthDegrees = Math.acos(clamp(cosAz, -1, 1)) * RAD_TO_DEG
  if (Math.sin(hourAngleRad) > 0) {
    azimuthDegrees = 360 - azimuthDegrees
  }

  return {
    altitudeDegrees: altRad * RAD_TO_DEG,
    azimuthDegrees: normalizeDegrees(azimuthDegrees),
  }
}

/**
 * Converts equatorial coordinates (RA/Dec) to horizontal coordinates
 * (alt/az) for a given observer location and instant.
 */
export function equatorialToHorizontal(
  equatorial: EquatorialCoordinates,
  location: ObserverLocation,
  date: Date,
): HorizontalCoordinates {
  const lstDegrees = localSiderealTimeDegrees(date, location.longitudeDegrees)
  const hourAngleDegrees = lstDegrees - equatorial.raHours * 15

  return equatorialToHorizontalAtHourAngle(
    equatorial.decDegrees,
    hourAngleDegrees,
    location.latitudeDegrees,
  )
}

/**
 * The observer location at which the given equatorial position sits at
 * zenith (altitude 90°) at this exact instant — the inverse of
 * equatorialToHorizontal for the transit case. Latitude is just the
 * declination; longitude is whatever makes local sidereal time equal the
 * object's RA (hour angle 0), i.e. `localSiderealTimeDegrees(date, lon) ===
 * equatorial.raHours * 15`. Used to relocate the observer to see something
 * that isn't visible from their current location (Starfield.tsx's
 * constellation list — see constellationProjection.ts's
 * findConstellationZenithLocation).
 */
export function zenithObserverLocation(
  equatorial: EquatorialCoordinates,
  date: Date,
): ObserverLocation {
  const longitudeDegrees = normalizeDegrees(
    equatorial.raHours * 15 - greenwichMeanSiderealTimeDegrees(date),
  )
  return {
    latitudeDegrees: equatorial.decDegrees,
    // normalizeDegrees returns [0, 360); wrap to (-180, 180] to match
    // ObserverLocation's east-positive convention (see its doc comment).
    longitudeDegrees:
      longitudeDegrees > 180 ? longitudeDegrees - 360 : longitudeDegrees,
  }
}
