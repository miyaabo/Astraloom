import { describe, expect, it } from 'vitest'
import {
  equatorialToHorizontal,
  equatorialToHorizontalAtHourAngle,
  greenwichMeanSiderealTimeDegrees,
} from './coordinates'

// Real RA/Dec from the HYG catalog (see hygCatalogSource.test.ts), reused
// here as the "known bright stars" fixtures required by
// docs/features/phase-1-implementation-tasks.md Task 3.
const SIRIUS = { raHours: 6.7525, decDegrees: -16.7161 }
const VEGA = { raHours: 18.6156, decDegrees: 38.7837 }

describe('greenwichMeanSiderealTimeDegrees', () => {
  it('matches the IAU reference value at the J2000.0 epoch', () => {
    // 2000-01-01T12:00:00Z is JD 2451545.0, where GMST is defined to be
    // 280.46061837deg (18h41m50.5s) — the standard anchor for this formula.
    const gmst = greenwichMeanSiderealTimeDegrees(
      new Date('2000-01-01T12:00:00Z'),
    )
    expect(gmst).toBeCloseTo(280.46061837, 5)
  })

  it('advances by ~360.9856deg per solar day (the sidereal/solar day mismatch)', () => {
    const day1 = greenwichMeanSiderealTimeDegrees(
      new Date('2000-01-01T12:00:00Z'),
    )
    const day2 = greenwichMeanSiderealTimeDegrees(
      new Date('2000-01-02T12:00:00Z'),
    )
    // day2 = day1 + 360.98564736629deg, wrapped into [0, 360).
    expect(day2).toBeCloseTo((day1 + 0.98564736629) % 360, 5)
  })
})

describe('equatorialToHorizontalAtHourAngle', () => {
  // At hour angle 0 an object is, by definition, crossing the observer's
  // meridian: altitude = 90 - |lat - dec|, azimuth exactly 0 or 180 deg.
  // This is geometry, not dependent on the sidereal-time half of the module.
  it('places Vega at its known culmination altitude/azimuth (observer north of Vega)', () => {
    const latitude = 51.5074 // London; north of Vega's declination
    const result = equatorialToHorizontalAtHourAngle(
      VEGA.decDegrees,
      0,
      latitude,
    )
    expect(result.altitudeDegrees).toBeCloseTo(
      90 - (latitude - VEGA.decDegrees),
      6,
    )
    expect(result.azimuthDegrees).toBeCloseTo(180, 5) // culminates south of zenith
  })

  it('places Sirius at its known culmination altitude/azimuth (observer north of Sirius)', () => {
    const latitude = 35.6762 // Tokyo; north of Sirius's declination
    const result = equatorialToHorizontalAtHourAngle(
      SIRIUS.decDegrees,
      0,
      latitude,
    )
    expect(result.altitudeDegrees).toBeCloseTo(
      90 - (latitude - SIRIUS.decDegrees),
      6,
    )
    expect(result.azimuthDegrees).toBeCloseTo(180, 6)
  })

  // At the equator every star is above the horizon for exactly half the
  // sidereal day, so its rise/set hour angle is always +/-90deg — an
  // independent check of both the altitude formula and azimuth quadrant
  // handling (rise = east side, set = west side).
  it('puts Vega (positive dec) on the horizon at +/-90deg hour angle, rising NE and setting NW', () => {
    const rising = equatorialToHorizontalAtHourAngle(VEGA.decDegrees, -90, 0)
    const setting = equatorialToHorizontalAtHourAngle(VEGA.decDegrees, 90, 0)

    expect(rising.altitudeDegrees).toBeCloseTo(0, 6)
    expect(setting.altitudeDegrees).toBeCloseTo(0, 6)
    expect(rising.azimuthDegrees).toBeLessThan(90) // NE
    expect(setting.azimuthDegrees).toBeGreaterThan(270) // NW
  })

  it('puts Sirius (negative dec) on the horizon at +/-90deg hour angle, rising SE and setting SW', () => {
    const rising = equatorialToHorizontalAtHourAngle(SIRIUS.decDegrees, -90, 0)
    const setting = equatorialToHorizontalAtHourAngle(SIRIUS.decDegrees, 90, 0)

    expect(rising.altitudeDegrees).toBeCloseTo(0, 6)
    expect(setting.altitudeDegrees).toBeCloseTo(0, 6)
    expect(rising.azimuthDegrees).toBeGreaterThan(90)
    expect(rising.azimuthDegrees).toBeLessThan(180) // SE
    expect(setting.azimuthDegrees).toBeGreaterThan(180)
    expect(setting.azimuthDegrees).toBeLessThan(270) // SW
  })
})

describe('equatorialToHorizontal', () => {
  it('reproduces Vega culmination end-to-end from a real Date + longitude', () => {
    // Solve for the JD where GMST(JD) + longitude == Vega's RA (in degrees),
    // i.e. hour angle 0, using the same closed-form Meeus formula
    // independently here (not by calling the module) so this is a genuine
    // check of the Date -> Julian Date -> GMST -> hour angle pipeline.
    const normalize360 = (degrees: number) => ((degrees % 360) + 360) % 360
    const longitude = 0 // Greenwich
    const targetGmstDegrees = normalize360(VEGA.raHours * 15 - longitude)
    const daysAfterJ2000 =
      normalize360(targetGmstDegrees - 280.46061837) / 360.98564736629
    const jd = 2451545.0 + daysAfterJ2000
    const date = new Date((jd - 2440587.5) * 86400000)

    const latitude = 51.5074
    const result = equatorialToHorizontal(
      VEGA,
      { latitudeDegrees: latitude, longitudeDegrees: longitude },
      date,
    )

    expect(result.altitudeDegrees).toBeCloseTo(
      90 - (latitude - VEGA.decDegrees),
      1,
    )
    expect(result.azimuthDegrees).toBeCloseTo(180, 1)
  })
})
