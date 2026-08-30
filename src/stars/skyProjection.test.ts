import { describe, expect, it } from 'vitest'
import { SKY_SPHERE_RADIUS, projectHorizontalToSphere } from './skyProjection'

describe('projectHorizontalToSphere', () => {
  it('places the zenith straight up', () => {
    const position = projectHorizontalToSphere({
      altitudeDegrees: 90,
      azimuthDegrees: 0,
    })
    expect(position.x).toBeCloseTo(0, 6)
    expect(position.y).toBeCloseTo(SKY_SPHERE_RADIUS, 6)
    expect(position.z).toBeCloseTo(0, 6)
  })

  it('places the horizon on the ground plane, north straight ahead', () => {
    const north = projectHorizontalToSphere({
      altitudeDegrees: 0,
      azimuthDegrees: 0,
    })
    expect(north.x).toBeCloseTo(0, 6)
    expect(north.y).toBeCloseTo(0, 6)
    expect(north.z).toBeCloseTo(-SKY_SPHERE_RADIUS, 6)

    const east = projectHorizontalToSphere({
      altitudeDegrees: 0,
      azimuthDegrees: 90,
    })
    expect(east.x).toBeCloseTo(SKY_SPHERE_RADIUS, 6)
    expect(east.y).toBeCloseTo(0, 6)
    expect(east.z).toBeCloseTo(0, 6)

    const south = projectHorizontalToSphere({
      altitudeDegrees: 0,
      azimuthDegrees: 180,
    })
    expect(south.x).toBeCloseTo(0, 6)
    expect(south.z).toBeCloseTo(SKY_SPHERE_RADIUS, 6)

    const west = projectHorizontalToSphere({
      altitudeDegrees: 0,
      azimuthDegrees: 270,
    })
    expect(west.x).toBeCloseTo(-SKY_SPHERE_RADIUS, 6)
    expect(west.z).toBeCloseTo(0, 6)
  })

  it('always places stars exactly SKY_SPHERE_RADIUS from the observer', () => {
    const position = projectHorizontalToSphere({
      altitudeDegrees: 37,
      azimuthDegrees: 205,
    })
    const distance = Math.hypot(position.x, position.y, position.z)
    expect(distance).toBeCloseTo(SKY_SPHERE_RADIUS, 6)
  })
})
