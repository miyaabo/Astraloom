import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import type { StarPosition } from '../stars/starTypes'

interface Vector3 {
  x: number
  y: number
  z: number
}

function normalize(v: Vector3): Vector3 {
  const length = Math.hypot(v.x, v.y, v.z)
  return { x: v.x / length, y: v.y / length, z: v.z / length }
}

function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

/** One image-pixel ⇔ real star correspondence, already resolved to a sky-sphere position (e.g. by the same equatorial→horizontal→sphere pipeline constellationProjection.ts uses). */
export interface TextureAnchor {
  pixelX: number
  pixelY: number
  position: StarPosition
}

export interface ArtMeshGrid {
  /** xyz triples on the sky sphere, row-major, (gridResolution+1) per row. */
  positions: Float32Array
  /** Matching [u,v] pairs in THREE.js texture-UV space (v=0 at image bottom). */
  uvs: Float32Array
  /** Triangle indices (two per grid cell). */
  indices: Uint16Array
}

/** The pixel rectangle of the source image to actually place on the sphere — see buildTexturedArtMeshGrid's note on why this usually isn't the whole image. */
export interface PixelBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Solves the 2x2 normal-equations system for a least-squares linear fit
 * `target = a*x + b*y + c`. Returns null if the system is singular
 * (degenerate/collinear input points).
 *
 * Centers `x`/`y` on their mean before building the normal equations (and
 * un-centers the result afterward) rather than solving the textbook 3x3
 * system directly on raw pixel coordinates — image pixel values run into the
 * hundreds, so `sum(x*x)` lands ~10^6 while the constant-term row is ~10^0,
 * a badly-conditioned system where naive Cramer's rule loses enough
 * precision to floating-point cancellation to return nonsense (verified:
 * predicted values off by 100x, not just imprecise). Centering keeps every
 * term in comparable magnitude, the standard fix for this exact conditioning
 * problem.
 */
function solveLeastSquaresPlane(
  points: { x: number; y: number }[],
  targets: number[],
): { a: number; b: number; c: number } | null {
  const n = points.length
  let meanX = 0
  let meanY = 0
  for (const p of points) {
    meanX += p.x
    meanY += p.y
  }
  meanX /= n
  meanY /= n

  let sxx = 0,
    sxy = 0,
    syy = 0
  let sxt = 0,
    syt = 0,
    st = 0
  for (let i = 0; i < n; i++) {
    const x = points[i].x - meanX
    const y = points[i].y - meanY
    const t = targets[i]
    sxx += x * x
    sxy += x * y
    syy += y * y
    sxt += x * t
    syt += y * t
    st += t
  }

  // | sxx sxy | |a|   | sxt |
  // | sxy syy | |b| = | syt |
  const det = sxx * syy - sxy * sxy
  if (Math.abs(det) < 1e-9) return null

  const a = (sxt * syy - syt * sxy) / det
  const b = (syt * sxx - sxt * sxy) / det
  const c = st / n - a * meanX - b * meanY

  return { a, b, c }
}

/**
 * Builds a curved mesh (a gridResolution x gridResolution grid of quads) that
 * maps an image onto the sky sphere, fit through pixel⇔real-star anchor
 * correspondences. Unlike the removed constellationArtOutline.ts's exact fit
 * through exactly 2 or 3 anchors, this is a least-squares fit across
 * however many anchors are given — appropriate when the source art wasn't
 * drawn to real star proportions to begin with (an AI-generated image, say),
 * so no exact fit through any 3 points would actually be more correct than
 * spreading the unavoidable error across all of them.
 *
 * Same overall technique: 1) gnomonic tangent-plane centered on the anchors'
 * mean direction, 2) least-squares affine pixel→tangent fit, 3) apply that
 * fit to a grid spanning `pixelBounds` and project each grid point back onto
 * the sphere. Returns null if fewer than 3 anchors are given, or the anchors
 * are degenerate (collinear in pixel space, or all behind the tangent
 * plane).
 *
 * `pixelBounds` is deliberately separate from the full image dimensions
 * (used only to normalize UVs against the actual texture) — a fit is only
 * trustworthy near the anchors it was fit from; extrapolating it out to a
 * full image's edges is a problem in practice when (as for an AI-generated
 * illustration meant to be viewed as a standalone picture) the anchors only
 * cover a small, roughly centered cluster with a lot of empty margin around
 * it. A grid spanning the full canvas then extrapolates the linear fit 2-4x
 * past where it was ever constrained, and a small amount of shear or
 * non-uniform scale in the fit (near-inevitable with a hand/AI-drawn image
 * that was never drawn to real star proportions) blows up into a wildly
 * distorted, sometimes self-overlapping mesh well before it reaches the
 * canvas edges — which was visibly swallowing the recognizable art near the
 * anchors into a barely-visible sliver of a much larger warped mess. Pass
 * pixelBounds tight around the actual artwork (not just the anchor cluster,
 * which can be smaller than the visible art extending beyond it) to keep the
 * grid in the fit's well-behaved region.
 */
export function buildTexturedArtMeshGrid(
  anchors: TextureAnchor[],
  pixelBounds: PixelBounds,
  imageWidthPx: number,
  imageHeightPx: number,
  gridResolution: number,
): ArtMeshGrid | null {
  if (anchors.length < 3) return null

  const anchorDirections = anchors.map((anchor) => normalize(anchor.position))
  const center = normalize(
    anchorDirections.reduce((sum, dir) => add(sum, dir), {
      x: 0,
      y: 0,
      z: 0,
    }),
  )

  const worldUp: Vector3 = { x: 0, y: 1, z: 0 }
  const reference =
    Math.abs(dot(worldUp, center)) > 0.999 ? { x: 1, y: 0, z: 0 } : worldUp
  const e1 = normalize(cross(reference, center))
  const e2 = cross(center, e1)

  const tangentPoints: { u: number; v: number }[] = []
  for (const dir of anchorDirections) {
    const cosAngle = dot(dir, center)
    if (cosAngle <= 0) return null
    const t = 1 / cosAngle
    tangentPoints.push({ u: t * dot(dir, e1), v: t * dot(dir, e2) })
  }

  const pixelPoints = anchors.map((anchor) => ({
    x: anchor.pixelX,
    y: anchor.pixelY,
  }))
  const uFit = solveLeastSquaresPlane(
    pixelPoints,
    tangentPoints.map((p) => p.u),
  )
  const vFit = solveLeastSquaresPlane(
    pixelPoints,
    tangentPoints.map((p) => p.v),
  )
  if (uFit === null || vFit === null) return null

  const pixelToSphere = (pixelX: number, pixelY: number): StarPosition => {
    const u = uFit.a * pixelX + uFit.b * pixelY + uFit.c
    const v = vFit.a * pixelX + vFit.b * pixelY + vFit.c
    const direction = normalize(add(center, add(scale(e1, u), scale(e2, v))))
    return scale(direction, SKY_SPHERE_RADIUS)
  }

  const { minX, minY, maxX, maxY } = pixelBounds
  const verticesPerRow = gridResolution + 1
  const positions = new Float32Array(verticesPerRow * verticesPerRow * 3)
  const uvs = new Float32Array(verticesPerRow * verticesPerRow * 2)
  for (let row = 0; row <= gridResolution; row++) {
    for (let col = 0; col <= gridResolution; col++) {
      const vertexIndex = row * verticesPerRow + col
      const pixelX = minX + (col / gridResolution) * (maxX - minX)
      const pixelY = minY + (row / gridResolution) * (maxY - minY)
      const sphere = pixelToSphere(pixelX, pixelY)
      positions[vertexIndex * 3] = sphere.x
      positions[vertexIndex * 3 + 1] = sphere.y
      positions[vertexIndex * 3 + 2] = sphere.z
      uvs[vertexIndex * 2] = pixelX / imageWidthPx
      uvs[vertexIndex * 2 + 1] = 1 - pixelY / imageHeightPx
    }
  }

  const indices = new Uint16Array(gridResolution * gridResolution * 6)
  let i = 0
  for (let row = 0; row < gridResolution; row++) {
    for (let col = 0; col < gridResolution; col++) {
      const topLeft = row * verticesPerRow + col
      const topRight = topLeft + 1
      const bottomLeft = topLeft + verticesPerRow
      const bottomRight = bottomLeft + 1
      indices[i++] = topLeft
      indices[i++] = bottomLeft
      indices[i++] = topRight
      indices[i++] = topRight
      indices[i++] = bottomLeft
      indices[i++] = bottomRight
    }
  }

  return { positions, uvs, indices }
}
