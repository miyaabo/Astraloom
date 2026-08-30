import type { HorizontalCoordinates } from '../astronomy/coordinates'
import { DEG_TO_RAD } from '../mathUtils'
import type { StarPosition } from './starTypes'

/**
 * Radius (world units) of the dome stars are placed on, centered on the
 * observer at the origin. Arbitrary — only its ratio to the renderer's
 * camera near/far planes matters (see StarfieldRenderer).
 */
export const SKY_SPHERE_RADIUS = 500

/**
 * Projects horizontal coordinates (alt/az) onto a sphere of SKY_SPHERE_RADIUS
 * centered on the observer, matching how the sky actually looks from the
 * ground: zenith straight up (+Y), north initially straight ahead (-Z, the
 * camera's default look direction), east to the right (+X) when facing
 * north.
 *
 * This is the only place that knows how alt/az becomes a 3D position, so the
 * astronomy module (src/astronomy) and star data sources stay unaware of the
 * rendering/view model (D003).
 */
export function projectHorizontalToSphere(
  horizontal: HorizontalCoordinates,
): StarPosition {
  const altitudeRad = horizontal.altitudeDegrees * DEG_TO_RAD
  const azimuthRad = horizontal.azimuthDegrees * DEG_TO_RAD
  const groundRadius = SKY_SPHERE_RADIUS * Math.cos(altitudeRad)

  return {
    x: groundRadius * Math.sin(azimuthRad),
    y: SKY_SPHERE_RADIUS * Math.sin(altitudeRad),
    z: -groundRadius * Math.cos(azimuthRad),
  }
}
