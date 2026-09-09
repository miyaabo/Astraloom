import type { ObserverLocation } from '../astronomy/coordinates'
import { equatorialToHorizontal } from '../astronomy/coordinates'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import { projectHorizontalToSphere } from '../stars/skyProjection'
import type { HygStarRecord } from '../stars/starTypes'
import { findConstellationArtByConstellationName } from './constellationArtCatalogSource'
import type { ConstellationArtPlacement } from './constellationArtTypes'

/** An outline needs at least this many above-horizon anchors to be placeable (Task 3/4: fitting the outline onto the sphere needs 2 points for a rotation+scale fit; below that there's nothing to fit). */
const MIN_ANCHORS_TO_PLACE = 2

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
 * Projects a constellation's art anchors onto the sky sphere (Task 4),
 * reusing the same equatorial→horizontal→sphere pipeline as
 * constellationProjection.ts's computeConstellationLineSegments, so the art
 * stays aligned with the stars/lines it's drawn against. Takes
 * `ConstellationRecord.name` (not `.id` — see constellationArtTypes.ts's
 * ConstellationArtRecord doc comment for why). Returns null when the
 * constellation has no art record or fewer than MIN_ANCHORS_TO_PLACE anchors
 * are above the horizon right now — nothing useful to fit art through in
 * either case, matching computeConstellationLineSegments dropping
 * below-horizon segments. Async because the underlying catalog is now
 * lazy-loaded (loadConstellationArtCatalog).
 */
export async function computeConstellationArtPlacement(
  constellationName: string,
  location: ObserverLocation,
  date: Date,
): Promise<ConstellationArtPlacement | null> {
  const record =
    await findConstellationArtByConstellationName(constellationName)
  if (record === null) return null

  const starsById = getStarsById()
  const anchors: ConstellationArtPlacement['anchors'] = []

  for (const anchor of record.anchors) {
    const star = starsById.get(anchor.starId)
    if (!star) continue

    const horizontal = equatorialToHorizontal(
      { raHours: star.raHours, decDegrees: star.decDegrees },
      location,
      date,
    )
    if (horizontal.altitudeDegrees < 0) continue

    anchors.push({
      pixelX: anchor.pixelX,
      pixelY: anchor.pixelY,
      position: projectHorizontalToSphere(horizontal),
    })
  }

  if (anchors.length < MIN_ANCHORS_TO_PLACE) return null

  return { anchors }
}
