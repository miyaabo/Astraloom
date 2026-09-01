import { describe, expect, it } from 'vitest'
import {
  AstroTime,
  Body,
  EquatorialCoordinates,
  Vector,
} from 'astronomy-engine'
import {
  createAstronomyEngineSmokeSample,
  createAstronomyObserver,
  createAstronomyTime,
  toAstronomyEngineBody,
  toCelestialBodyEquatorialCoordinates,
  toCelestialBodyHorizontalCoordinates,
  toIlluminatedFraction,
} from './astronomyEngineAdapter'

describe('astronomyEngineAdapter', () => {
  it('maps supported body ids to Astronomy Engine bodies', () => {
    expect(toAstronomyEngineBody('moon')).toBe(Body.Moon)
    expect(toAstronomyEngineBody('venus')).toBe(Body.Venus)
    expect(toAstronomyEngineBody('saturn')).toBe(Body.Saturn)
  })

  it('converts observer/time and library coordinate outputs into local boundary types', () => {
    const observer = createAstronomyObserver({
      latitudeDegrees: 35.6762,
      longitudeDegrees: 139.6503,
    })
    const time = createAstronomyTime(new Date('2026-09-01T00:00:00.000Z'))

    expect(observer).toMatchObject({
      latitude: 35.6762,
      longitude: 139.6503,
      height: 0,
    })
    expect(time.date.toISOString()).toBe('2026-09-01T00:00:00.000Z')

    expect(
      toCelestialBodyEquatorialCoordinates(
        new EquatorialCoordinates(
          12.5,
          -7.25,
          0.42,
          new Vector(1, 2, 3, new AstroTime(new Date('2026-09-01T00:00:00.000Z'))),
        ),
      ),
    ).toEqual({
      raHours: 12.5,
      decDegrees: -7.25,
    })

    expect(
      toCelestialBodyHorizontalCoordinates({
        azimuth: 123.4,
        altitude: 56.7,
        ra: 1.2,
        dec: 3.4,
      }),
    ).toEqual({
      azimuthDegrees: 123.4,
      altitudeDegrees: 56.7,
    })

    expect(
      toIlluminatedFraction(
        {
          phase_fraction: 0.61,
        } as unknown as Parameters<typeof toIlluminatedFraction>[0],
      ),
    ).toBe(0.61)
  })

  it('can call Astronomy Engine through the adapter without touching star logic', () => {
    const sample = createAstronomyEngineSmokeSample(
      new Date('2026-09-01T00:00:00.000Z'),
      {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
    )

    expect(sample.time.date.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(sample.observer).toMatchObject({
      latitude: 35.6762,
      longitude: 139.6503,
      height: 0,
    })
    expect(sample.horizon.azimuthDegrees).toBeGreaterThanOrEqual(0)
    expect(sample.horizon.azimuthDegrees).toBeLessThan(360)
    expect(sample.horizon.altitudeDegrees).toBeGreaterThanOrEqual(-90)
    expect(sample.horizon.altitudeDegrees).toBeLessThanOrEqual(90)
    expect(sample.illuminatedFraction).toBeGreaterThanOrEqual(0)
    expect(sample.illuminatedFraction).toBeLessThanOrEqual(1)
  })
})
