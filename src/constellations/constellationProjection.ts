import type { ObserverLocation } from '../astronomy/coordinates'
import { equatorialToHorizontal } from '../astronomy/coordinates'
import { normalizeDegrees, RAD_TO_DEG } from '../mathUtils'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import { projectHorizontalToSphere } from '../stars/skyProjection'
import type { HygStarRecord } from '../stars/starTypes'
import type {
  ConstellationLineSegment,
  ConstellationRecord,
  ConstellationStarLabel,
} from './constellationTypes'

let cachedStarsById: Map<number, HygStarRecord> | null = null

function getStarsById(): Map<number, HygStarRecord> {
  if (cachedStarsById === null) {
    cachedStarsById = new Map(
      loadHygStarCatalog().map((star) => [star.id, star]),
    )
  }
  return cachedStarsById
}

/**
 * Projects a constellation's line segments onto the sky sphere (Task 3),
 * reusing the same equatorial→horizontal→sphere pipeline as the stars
 * themselves (src/astronomy/coordinates.ts, skyProjection.ts) so lines stay
 * aligned with the star positions they connect. A segment is dropped when
 * either endpoint is below the horizon, matching how generateRealStarData
 * drops below-horizon stars.
 */
export function computeConstellationLineSegments(
  constellation: ConstellationRecord,
  location: ObserverLocation,
  date: Date,
): ConstellationLineSegment[] {
  const starsById = getStarsById()
  const segments: ConstellationLineSegment[] = []

  for (const [startId, endId] of constellation.segments) {
    const startStar = starsById.get(startId)
    const endStar = starsById.get(endId)
    if (!startStar || !endStar) continue

    const startHorizontal = equatorialToHorizontal(
      { raHours: startStar.raHours, decDegrees: startStar.decDegrees },
      location,
      date,
    )
    const endHorizontal = equatorialToHorizontal(
      { raHours: endStar.raHours, decDegrees: endStar.decDegrees },
      location,
      date,
    )
    if (
      startHorizontal.altitudeDegrees < 0 ||
      endHorizontal.altitudeDegrees < 0
    ) {
      continue
    }

    segments.push({
      start: projectHorizontalToSphere(startHorizontal),
      end: projectHorizontalToSphere(endHorizontal),
    })
  }

  return segments
}

/**
 * Proper-named stars within a constellation (Task 4), projected the same way
 * as computeConstellationLineSegments. Only stars with a proper name
 * (src/stars/starTypes.ts, from the HYG Database's `proper` column) produce a
 * label; a segment's endpoint below the horizon is skipped, matching the line
 * segments it belongs to. A star referenced by multiple segments is only
 * returned once.
 */
export function computeConstellationStarLabels(
  constellation: ConstellationRecord,
  location: ObserverLocation,
  date: Date,
): ConstellationStarLabel[] {
  const starsById = getStarsById()
  const uniqueStarIds = new Set<number>()
  for (const [startId, endId] of constellation.segments) {
    uniqueStarIds.add(startId)
    uniqueStarIds.add(endId)
  }

  const labels: ConstellationStarLabel[] = []
  for (const starId of uniqueStarIds) {
    const star = starsById.get(starId)
    if (!star?.properName) continue

    const horizontal = equatorialToHorizontal(
      { raHours: star.raHours, decDegrees: star.decDegrees },
      location,
      date,
    )
    if (horizontal.altitudeDegrees < 0) continue

    labels.push({
      starId,
      properName: star.properName,
      position: projectHorizontalToSphere(horizontal),
    })
  }

  return labels
}

/**
 * The average look direction (azimuth/altitude) of a constellation's visible
 * line segments — used both as a display anchor for its name label (Task 4)
 * and by Starfield.tsx's dev-only test button to point the camera at it
 * directly (Task 3) ahead of Task 5's real selection.
 */
export function computeConstellationLookDirection(
  segments: ConstellationLineSegment[],
): { azimuthDegrees: number; altitudeDegrees: number } | null {
  let sumX = 0
  let sumY = 0
  let sumZ = 0
  for (const segment of segments) {
    sumX += segment.start.x + segment.end.x
    sumY += segment.start.y + segment.end.y
    sumZ += segment.start.z + segment.end.z
  }
  const length = Math.hypot(sumX, sumY, sumZ)
  if (length === 0) return null

  return {
    altitudeDegrees: Math.asin(sumY / length) * RAD_TO_DEG,
    azimuthDegrees: normalizeDegrees(Math.atan2(sumX, -sumZ) * RAD_TO_DEG),
  }
}
