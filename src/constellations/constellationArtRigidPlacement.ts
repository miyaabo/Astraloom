import {
  computeConstellationIllustrationData,
  computeConstellationStarPositions,
} from './constellationProjection'
import type { ConstellationArtRecord } from './constellationArtTypes'
import type { ConstellationRecord } from './constellationTypes'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import type { ArtMeshGrid } from './constellationArtTexturePlacement'
import type { ObserverLocation } from '../astronomy/coordinates'

interface Vector3 {
  x: number
  y: number
  z: number
}

interface Point2 {
  x: number
  y: number
}

interface SimilarityTransform {
  apply(point: Point2): Point2
}

function normalize(vector: Vector3): Vector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length }
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

function guidePointForStar(
  point: Point2,
  sourceBounds: { minX: number; minY: number; maxX: number; maxY: number },
  guideBounds: ConstellationArtRecord['guideBounds'],
): Point2 {
  const sourceCenterX = (sourceBounds.minX + sourceBounds.maxX) / 2
  const sourceCenterY = (sourceBounds.minY + sourceBounds.maxY) / 2
  const guideCenterX = (guideBounds.minX + guideBounds.maxX) / 2
  const guideCenterY = (guideBounds.minY + guideBounds.maxY) / 2
  const sourceSpan = Math.max(
    sourceBounds.maxX - sourceBounds.minX,
    sourceBounds.maxY - sourceBounds.minY,
  )
  const guideSpan = Math.max(
    guideBounds.maxX - guideBounds.minX,
    guideBounds.maxY - guideBounds.minY,
  )
  const scale = guideSpan / sourceSpan
  return {
    x: guideCenterX + (point.x - sourceCenterX) * scale,
    // The guide SVG flips the mathematical north/up y-axis into image space.
    y: guideCenterY - (point.y - sourceCenterY) * scale,
  }
}

function fitSimilarity(
  source: Point2[],
  target: Point2[],
): SimilarityTransform | null {
  if (source.length < 2 || source.length !== target.length) return null
  const sourceCenter = source.reduce(
    (sum, point) => ({
      x: sum.x + point.x / source.length,
      y: sum.y + point.y / source.length,
    }),
    { x: 0, y: 0 },
  )
  const targetCenter = target.reduce(
    (sum, point) => ({
      x: sum.x + point.x / target.length,
      y: sum.y + point.y / target.length,
    }),
    { x: 0, y: 0 },
  )
  let regularA = 0
  let regularB = 0
  let reflectedA = 0
  let reflectedB = 0
  let denominator = 0
  for (let index = 0; index < source.length; index++) {
    const sx = source[index].x - sourceCenter.x
    const sy = source[index].y - sourceCenter.y
    const tx = target[index].x - targetCenter.x
    const ty = target[index].y - targetCenter.y
    regularA += sx * tx + sy * ty
    regularB += sx * ty - sy * tx
    reflectedA += sx * tx - sy * ty
    reflectedB += sx * ty + sy * tx
    denominator += sx * sx + sy * sy
  }
  if (denominator === 0) return null
  const regular = { a: regularA / denominator, b: regularB / denominator }
  const reflected = { a: reflectedA / denominator, b: reflectedB / denominator }
  const errorFor = (candidate: { a: number; b: number }, reflection: boolean) =>
    source.reduce((error, point, index) => {
      const x = point.x - sourceCenter.x
      const y = point.y - sourceCenter.y
      const mapped = reflection
        ? {
            x: candidate.a * x + candidate.b * y,
            y: candidate.b * x - candidate.a * y,
          }
        : {
            x: candidate.a * x - candidate.b * y,
            y: candidate.b * x + candidate.a * y,
          }
      return (
        error +
        (mapped.x - (target[index].x - targetCenter.x)) ** 2 +
        (mapped.y - (target[index].y - targetCenter.y)) ** 2
      )
    }, 0)
  const useReflection = errorFor(reflected, true) < errorFor(regular, false)
  const chosen = useReflection ? reflected : regular
  return {
    apply(point) {
      const x = point.x - sourceCenter.x
      const y = point.y - sourceCenter.y
      const mapped = useReflection
        ? { x: chosen.a * x + chosen.b * y, y: chosen.b * x - chosen.a * y }
        : { x: chosen.a * x - chosen.b * y, y: chosen.b * x + chosen.a * y }
      return { x: targetCenter.x + mapped.x, y: targetCenter.y + mapped.y }
    },
  }
}

function transformImagePoint(
  point: Point2,
  record: ConstellationArtRecord,
): Point2 {
  const artCenterX = (record.pixelBounds.minX + record.pixelBounds.maxX) / 2
  const artCenterY = (record.pixelBounds.minY + record.pixelBounds.maxY) / 2
  const guideCenterX = (record.guideBounds.minX + record.guideBounds.maxX) / 2
  const guideCenterY = (record.guideBounds.minY + record.guideBounds.maxY) / 2
  const radians = (record.rotationDeg * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const x = (point.x - artCenterX) * (record.flipX ? -1 : 1) * record.scale
  const y = (point.y - artCenterY) * (record.flipY ? -1 : 1) * record.scale
  return {
    x: guideCenterX + record.offsetX + cos * x - sin * y,
    y: guideCenterY + record.offsetY + sin * x + cos * y,
  }
}

/**
 * Produces a four-corner textured plane for a no-line illustration. The
 * guide-to-sky fit is a single similarity transform; it never uses an affine
 * fit, a mesh warp, TPS, or a per-pixel deformation.
 */
export function buildRigidConstellationArtMesh(
  constellation: ConstellationRecord,
  record: ConstellationArtRecord,
  location: ObserverLocation,
  date: Date,
): ArtMeshGrid | null {
  const illustration = computeConstellationIllustrationData(constellation)
  if (illustration === null) return null
  const liveById = new Map(
    computeConstellationStarPositions(constellation, location, date).map(
      (star) => [star.starId, star.position],
    ),
  )
  const pairs = illustration.stars.flatMap((star) => {
    const position = liveById.get(star.id)
    return position === undefined ? [] : [{ source: star, position }]
  })
  if (pairs.length < 2) return null

  const center = normalize(
    pairs.reduce<Vector3>(
      (sum, pair) => ({
        x: sum.x + pair.position.x,
        y: sum.y + pair.position.y,
        z: sum.z + pair.position.z,
      }),
      { x: 0, y: 0, z: 0 },
    ),
  )
  const up =
    Math.abs(center.y) > 0.999 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 }
  const axisX = normalize(cross(up, center))
  const axisY = cross(center, axisX)
  const sourceBounds = {
    minX: Math.min(...illustration.stars.map((star) => star.x)),
    minY: Math.min(...illustration.stars.map((star) => star.y)),
    maxX: Math.max(...illustration.stars.map((star) => star.x)),
    maxY: Math.max(...illustration.stars.map((star) => star.y)),
  }
  const guidePoints = pairs.map((pair) =>
    guidePointForStar(pair.source, sourceBounds, record.guideBounds),
  )
  const tangentPoints = pairs.map((pair) => {
    const direction = normalize(pair.position)
    const depth = dot(direction, center)
    return {
      x: dot(direction, axisX) / depth,
      y: dot(direction, axisY) / depth,
    }
  })
  const guideToTangent = fitSimilarity(guidePoints, tangentPoints)
  if (guideToTangent === null) return null

  const corners = [
    { x: record.pixelBounds.minX, y: record.pixelBounds.minY },
    { x: record.pixelBounds.maxX, y: record.pixelBounds.minY },
    { x: record.pixelBounds.minX, y: record.pixelBounds.maxY },
    { x: record.pixelBounds.maxX, y: record.pixelBounds.maxY },
  ]
  const positions = new Float32Array(12)
  const uvs = new Float32Array(8)
  corners.forEach((corner, index) => {
    const tangent = guideToTangent.apply(transformImagePoint(corner, record))
    // Keep the artwork as one rigid plane tangent to the sky sphere. Its
    // points share the stars' viewing rays, but the plane itself is never
    // bent onto the sphere or subdivided into a deformable grid.
    const planePoint = {
      x: center.x + axisX.x * tangent.x + axisY.x * tangent.y,
      y: center.y + axisX.y * tangent.x + axisY.y * tangent.y,
      z: center.z + axisX.z * tangent.x + axisY.z * tangent.y,
    }
    positions.set(
      [
        planePoint.x * SKY_SPHERE_RADIUS,
        planePoint.y * SKY_SPHERE_RADIUS,
        planePoint.z * SKY_SPHERE_RADIUS,
      ],
      index * 3,
    )
    uvs.set(
      [corner.x / record.imageWidthPx, 1 - corner.y / record.imageHeightPx],
      index * 2,
    )
  })
  return { positions, uvs, indices: new Uint16Array([0, 2, 1, 1, 2, 3]) }
}
