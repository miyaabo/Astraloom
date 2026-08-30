/** Pure bearing math for CompassOverlay, split out so the component file only exports components (react-refresh/only-export-components). */

import { clamp } from './mathUtils'

// Bearing (degrees left/right of straight ahead) that maps to the strip's
// left/right edge. Wider than the camera's actual horizontal FOV so a label
// keeps sliding smoothly for a while before it reaches the edge, rather than
// snapping straight to the edge as soon as it leaves view.
export const EDGE_BEARING_DEGREES = 100

/** Wraps a degree difference into (-180, 180]. */
export function normalizeBearing(deltaDegrees: number): number {
  const wrapped = deltaDegrees % 360
  if (wrapped <= -180) return wrapped + 360
  if (wrapped > 180) return wrapped - 360
  return wrapped
}

/** Horizontal position (0-100) of a marker along the strip for a given heading. */
export function computeLeftPercent(
  azimuthDegrees: number,
  headingDegrees: number,
): number {
  const bearing = normalizeBearing(azimuthDegrees - headingDegrees)
  const clamped = clamp(bearing, -EDGE_BEARING_DEGREES, EDGE_BEARING_DEGREES)
  return ((clamped + EDGE_BEARING_DEGREES) / (2 * EDGE_BEARING_DEGREES)) * 100
}
