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
 * Ratio of the smaller to the larger singular value of the 2x2 matrix
 * `[[a, b], [c, d]]` (closed-form 2x2 SVD) — 1 for a pure rotation+uniform
 * scale, 0 for a matrix that collapses the plane onto a line. Used to detect
 * when solveLeastSquaresPlane's affine fit, even though not exactly singular
 * (det !== 0, so it doesn't hit the `return null` above), is close enough to
 * singular that applying it anyway would squash the source image into a
 * barely-visible sliver — observed on Apus, whose own three real stars sit
 * nearly in a line on the sky, so no matter which pixels its anchors are
 * placed at, the least-squares fit is forced to make pixel-space's two
 * independent directions map to nearly the same tangent-plane direction.
 */
function singularValueRatio(a: number, b: number, c: number, d: number): number {
  const e = (a + d) / 2
  const f = (a - d) / 2
  const g = (c + b) / 2
  const h = (c - b) / 2
  const q = Math.hypot(e, h)
  const r = Math.hypot(f, g)
  const sigma1 = q + r
  const sigma2 = Math.abs(q - r)
  return sigma1 === 0 ? 0 : sigma2 / sigma1
}

/**
 * Below this singular-value ratio, buildTexturedArtMeshGrid falls back to
 * buildSimilarityPixelToSphere instead of trusting the affine fit — chosen
 * empirically by comparing measured ratios against how the result actually
 * looked: Apus (0.169), Aquila (0.157), and Orion (0.322, 23 anchors) all
 * rendered as a thin, barely-recognizable sliver, while Antlia (0.520) and
 * Andromeda (0.745, still visibly stretched but recognizable) were
 * acceptable. Not derived from a formal error bound.
 */
const DEGENERATE_FIT_RATIO_THRESHOLD = 0.4

/**
 * Rigid fallback for when the anchors' real sky positions are too close to
 * collinear for an affine fit to trust (see singularValueRatio): a
 * least-squares rotation + uniform scale + translation through every anchor
 * (the standard complex-number solution to orthogonal Procrustes without
 * reflection — treating each centered pixel offset and tangent offset as a
 * complex number, the best-fit scale-rotation factor is
 * `sum(conj(p) * t) / sum(|p|^2)`), so the source image keeps its own
 * proportions exactly — unlike the affine path, it can't warp the picture
 * into a sliver.
 *
 * An earlier version fit exactly through whichever two anchors were
 * farthest apart in tangent-plane space and ignored the rest. That let a
 * single outlier pair dictate the whole image's scale: if that pair
 * happened to sit close together in the picture but far apart on the sky
 * (or vice versa), every other anchor could end up dragged far from its own
 * star even though the two chosen ones fit exactly — observed on Aquila,
 * whose eagle rendered much larger than its actual star cluster. Fitting
 * through all anchors at once spreads any such mismatch across every point
 * instead of letting one pair's ratio dominate.
 */
function buildSimilarityPixelToSphere(
  anchors: TextureAnchor[],
  tangentPoints: { u: number; v: number }[],
  center: Vector3,
  e1: Vector3,
  e2: Vector3,
): (pixelX: number, pixelY: number) => StarPosition {
  const n = anchors.length
  let meanPixelX = 0
  let meanPixelY = 0
  let meanU = 0
  let meanV = 0
  for (let i = 0; i < n; i++) {
    meanPixelX += anchors[i].pixelX
    meanPixelY += anchors[i].pixelY
    meanU += tangentPoints[i].u
    meanV += tangentPoints[i].v
  }
  meanPixelX /= n
  meanPixelY /= n
  meanU /= n
  meanV /= n

  // conj(p) * t = (px - i*py) * (tu + i*tv), summed and divided by sum(|p|^2).
  let numeratorReal = 0
  let numeratorImag = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    const px = anchors[i].pixelX - meanPixelX
    const py = anchors[i].pixelY - meanPixelY
    const tu = tangentPoints[i].u - meanU
    const tv = tangentPoints[i].v - meanV
    numeratorReal += px * tu + py * tv
    numeratorImag += px * tv - py * tu
    denominator += px * px + py * py
  }
  // denominator is 0 only if every anchor shares the same pixel position,
  // which authoring can't produce (each is a distinct star); the fallback
  // (no scale/rotation) just avoids a NaN mesh in that unreachable case.
  const scaleRotationReal = denominator === 0 ? 1 : numeratorReal / denominator
  const scaleRotationImag = denominator === 0 ? 0 : numeratorImag / denominator

  return (pixelX: number, pixelY: number): StarPosition => {
    const dx = pixelX - meanPixelX
    const dy = pixelY - meanPixelY
    const u = meanU + (dx * scaleRotationReal - dy * scaleRotationImag)
    const v = meanV + (dx * scaleRotationImag + dy * scaleRotationReal)
    const direction = normalize(add(center, add(scale(e1, u), scale(e2, v))))
    return scale(direction, SKY_SPHERE_RADIUS)
  }
}

/**
 * Builds a curved mesh (a gridResolution x gridResolution grid of quads) that
 * maps an image onto the sky sphere, fit through pixel⇔real-star anchor
 * correspondences. With 3+ well-conditioned anchors this is a least-squares
 * affine fit across however many are given — appropriate when the source art
 * wasn't drawn to real star proportions to begin with (an AI-generated
 * image, say), so no exact fit through any 3 points would actually be more
 * correct than spreading the unavoidable error across all of them. With
 * exactly 2 anchors, or 3+ whose real sky positions are too close to
 * collinear for the affine fit to trust (singularValueRatio), it falls back
 * to a rigid rotate+scale+translate through the two farthest-apart anchors
 * (buildSimilarityPixelToSphere) instead — the source image keeps its own
 * proportions exactly, at the cost of anchors beyond those two landing
 * wherever the rigid transform puts them rather than exactly on their real
 * star.
 *
 * Same overall technique: 1) gnomonic tangent-plane centered on the anchors'
 * mean direction, 2) affine or similarity pixel→tangent fit (see above), 3)
 * apply that fit to a grid spanning `pixelBounds` and project each grid
 * point back onto the sphere. Returns null if fewer than 2 anchors are
 * given, or all of them are behind the tangent plane.
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
  if (anchors.length < 2) return null

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

  // Affine (least-squares through every anchor) when there are enough
  // anchors and the fit isn't nearly-singular; otherwise a rigid
  // rotate+scale+translate through the two farthest-apart anchors, which
  // can't warp the source image no matter how degenerate the real stars'
  // arrangement is (see singularValueRatio / buildSimilarityPixelToSphere).
  let pixelToSphere: ((pixelX: number, pixelY: number) => StarPosition) | null =
    null
  if (anchors.length >= 3) {
    const uFit = solveLeastSquaresPlane(
      pixelPoints,
      tangentPoints.map((p) => p.u),
    )
    const vFit = solveLeastSquaresPlane(
      pixelPoints,
      tangentPoints.map((p) => p.v),
    )
    if (
      uFit !== null &&
      vFit !== null &&
      singularValueRatio(uFit.a, uFit.b, vFit.a, vFit.b) >=
        DEGENERATE_FIT_RATIO_THRESHOLD
    ) {
      pixelToSphere = (pixelX: number, pixelY: number): StarPosition => {
        const u = uFit.a * pixelX + uFit.b * pixelY + uFit.c
        const v = vFit.a * pixelX + vFit.b * pixelY + vFit.c
        const direction = normalize(
          add(center, add(scale(e1, u), scale(e2, v))),
        )
        return scale(direction, SKY_SPHERE_RADIUS)
      }
    }
  }
  if (pixelToSphere === null) {
    pixelToSphere = buildSimilarityPixelToSphere(
      anchors,
      tangentPoints,
      center,
      e1,
      e2,
    )
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
