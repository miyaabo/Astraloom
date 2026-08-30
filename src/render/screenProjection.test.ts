import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { findNearestScreenPoint, projectToScreen } from './screenProjection'

function makeCamera(): THREE.PerspectiveCamera {
  // Default orientation: at the origin, looking down -Z, +Y up — matches
  // StarfieldRenderer's camera before any rotation is applied.
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
  camera.updateProjectionMatrix()
  return camera
}

describe('projectToScreen', () => {
  it('projects a point straight ahead to the screen center', () => {
    const projection = projectToScreen(makeCamera(), { x: 0, y: 0, z: -100 })

    expect(projection.xPercent).toBeCloseTo(50, 5)
    expect(projection.yPercent).toBeCloseTo(50, 5)
    expect(projection.visible).toBe(true)
  })

  it('marks a point behind the camera as not visible', () => {
    const projection = projectToScreen(makeCamera(), { x: 0, y: 0, z: 100 })

    expect(projection.visible).toBe(false)
  })

  it('marks a point far outside the field of view as not visible', () => {
    const projection = projectToScreen(makeCamera(), { x: 500, y: 0, z: -1 })

    expect(projection.visible).toBe(false)
  })

  it('offsets from center consistently with a point up and to the right', () => {
    const projection = projectToScreen(makeCamera(), { x: 10, y: 10, z: -100 })

    expect(projection.xPercent).toBeGreaterThan(50)
    // Screen y grows downward while world y grows upward, so a point above
    // center must map to a smaller yPercent.
    expect(projection.yPercent).toBeLessThan(50)
  })
})

describe('findNearestScreenPoint', () => {
  interface Candidate {
    key: string
    position: { x: number; y: number; z: number }
  }

  const CENTER: Candidate = { key: 'center', position: { x: 0, y: 0, z: -100 } }
  // A camera with 70° vertical FOV at 800x800 covers roughly ±280 world units
  // of horizontal offset at z=-100, so this lands comfortably in view but far
  // from CENTER on screen.
  const OFFSET: Candidate = {
    key: 'offset',
    position: { x: 50, y: 0, z: -100 },
  }
  const BEHIND_CAMERA: Candidate = {
    key: 'behind',
    position: { x: 0, y: 0, z: 100 },
  }

  it('returns the candidate under the pointer', () => {
    const nearest = findNearestScreenPoint(
      makeCamera(),
      [CENTER, OFFSET],
      (c) => c.position,
      50,
      50,
      800,
      800,
      20,
    )
    expect(nearest?.key).toBe('center')
  })

  it('returns null when nothing is within the hit radius', () => {
    const nearest = findNearestScreenPoint(
      makeCamera(),
      [OFFSET],
      (c) => c.position,
      50,
      50,
      800,
      800,
      1,
    )
    expect(nearest).toBeNull()
  })

  it('ignores candidates outside the camera view (e.g. behind it)', () => {
    const nearest = findNearestScreenPoint(
      makeCamera(),
      [BEHIND_CAMERA],
      (c) => c.position,
      50,
      50,
      800,
      800,
      1000,
    )
    expect(nearest).toBeNull()
  })

  it('picks the closest candidate when multiple are within range', () => {
    const near: Candidate = { key: 'near', position: { x: 1, y: 0, z: -100 } }
    const nearest = findNearestScreenPoint(
      makeCamera(),
      [OFFSET, near],
      (c) => c.position,
      50,
      50,
      800,
      800,
      1000,
    )
    expect(nearest?.key).toBe('near')
  })
})
