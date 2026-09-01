import { projectHorizontalToSphere } from './skyProjection'

/**
 * Ground/horizon dome mesh data (4次 Task 4, D018): a triangulated grid
 * covering the full 360° azimuth and altitudes from -90° (straight down) up
 * to some span above the horizon, projected onto the same sky sphere as
 * stars via projectHorizontalToSphere so it scales identically under
 * drag/zoom. Unlike stars/the Milky Way band, the ground is fixed in the
 * observer's horizontal frame and never depends on date or location (the
 * ground doesn't move as the sky rotates), so this only needs to be built
 * once per app lifetime — see StarfieldRenderer, which has no
 * updateHorizon() counterpart to updateStars/updateMilkyWay.
 */
export interface HorizonMeshData {
  positions: Float32Array
  /**
   * Per-vertex depth below the horizon: 0 exactly at the horizon (altitude
   * 0°), 1 at the bottom of the dome (altitude -90°), and negative above the
   * horizon (up to -riseAboveHorizonDegrees/90 at the top edge). Lets the
   * renderer's fragment shader fade a ground fill / horizon glow without
   * recomputing altitude from the 3D position.
   */
  depths: Float32Array
  indices: Uint32Array
}

/**
 * @param azimuthSegments Divisions around the full 360° azimuth; higher = smoother horizon curve.
 * @param altitudeSegments Divisions from the horizon down to straight-down (nadir).
 * @param riseAboveHorizonDegrees How far above altitude 0° the mesh extends, so the horizon glow has room to fade into the sky rather than cutting off sharply at the horizon line.
 */
export function generateHorizonMeshData(
  azimuthSegments: number,
  altitudeSegments: number,
  riseAboveHorizonDegrees: number,
): HorizonMeshData {
  const ringCount = altitudeSegments + 1
  const verticesPerRing = azimuthSegments + 1
  const positions = new Float32Array(ringCount * verticesPerRing * 3)
  const depths = new Float32Array(ringCount * verticesPerRing)

  for (let ring = 0; ring < ringCount; ring++) {
    const t = ring / altitudeSegments
    const altitudeDegrees = -90 + t * (90 + riseAboveHorizonDegrees)
    const depth = -altitudeDegrees / 90

    for (let seg = 0; seg < verticesPerRing; seg++) {
      const azimuthDegrees = (seg / azimuthSegments) * 360
      const vertexIndex = ring * verticesPerRing + seg
      const position = projectHorizontalToSphere({
        altitudeDegrees,
        azimuthDegrees,
      })
      positions[vertexIndex * 3] = position.x
      positions[vertexIndex * 3 + 1] = position.y
      positions[vertexIndex * 3 + 2] = position.z
      depths[vertexIndex] = depth
    }
  }

  const indices = new Uint32Array(altitudeSegments * azimuthSegments * 6)
  let i = 0
  for (let ring = 0; ring < altitudeSegments; ring++) {
    for (let seg = 0; seg < azimuthSegments; seg++) {
      const a = ring * verticesPerRing + seg
      const b = a + verticesPerRing
      const c = a + 1
      const d = b + 1
      // Two triangles per quad; winding matches an outward-facing sphere
      // (consistent with projectHorizontalToSphere's convention), so the
      // renderer uses THREE.BackSide to make it visible from inside — see
      // StarfieldRenderer.
      indices[i++] = a
      indices[i++] = b
      indices[i++] = c
      indices[i++] = c
      indices[i++] = b
      indices[i++] = d
    }
  }

  return { positions, depths, indices }
}
