import * as THREE from 'three'
import type { StarPosition } from '../stars/starTypes'

export interface ScreenProjection {
  /** Horizontal position as a percentage of viewport width (0-100). */
  xPercent: number
  /** Vertical position as a percentage of viewport height (0-100). */
  yPercent: number
  /** False when the point is behind the camera or outside its view frustum. */
  visible: boolean
}

// Reused across calls to avoid allocating a Vector3 per label per frame
// (CLAUDE.md Performance Rules).
const scratch = new THREE.Vector3()

/**
 * Projects a world-space point (e.g. a star on the sky sphere) to a
 * percentage-based screen position for an HTML overlay label (Task 4), using
 * the same camera the star sphere itself is rendered with so labels stay
 * aligned with the stars/lines they annotate.
 */
export function projectToScreen(
  camera: THREE.Camera,
  position: StarPosition,
): ScreenProjection {
  scratch.set(position.x, position.y, position.z)
  scratch.project(camera)

  const visible =
    scratch.z > -1 &&
    scratch.z < 1 &&
    Math.abs(scratch.x) <= 1 &&
    Math.abs(scratch.y) <= 1

  return {
    xPercent: (scratch.x + 1) * 50,
    yPercent: (1 - scratch.y) * 50,
    visible,
  }
}

/**
 * Finds the candidate closest on screen to a pointer position (Task 5's star
 * tap/click hit test), within a fixed pixel radius — wider than a star's
 * rendered point size so touch input stays forgiving (see
 * starfieldConfig.controls.tap.hitRadiusPixels). Distance is measured in
 * actual on-screen pixels (via the viewport dimensions), not raw percent, so
 * the hit radius reads the same regardless of the canvas's aspect ratio.
 * Candidates behind the camera or outside its view are never matched.
 */
export function findNearestScreenPoint<T>(
  camera: THREE.Camera,
  candidates: readonly T[],
  getPosition: (candidate: T) => StarPosition,
  pointerXPercent: number,
  pointerYPercent: number,
  viewportWidth: number,
  viewportHeight: number,
  maxDistancePixels: number,
): T | null {
  let nearest: T | null = null
  let nearestDistance = Infinity

  for (const candidate of candidates) {
    const projection = projectToScreen(camera, getPosition(candidate))
    if (!projection.visible) continue

    const dx = ((projection.xPercent - pointerXPercent) / 100) * viewportWidth
    const dy = ((projection.yPercent - pointerYPercent) / 100) * viewportHeight
    const distance = Math.hypot(dx, dy)

    if (distance <= maxDistancePixels && distance < nearestDistance) {
      nearest = candidate
      nearestDistance = distance
    }
  }

  return nearest
}
