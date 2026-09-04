import type { ObserverLocation } from '../astronomy/coordinates'
import { equatorialToHorizontal } from '../astronomy/coordinates'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import { projectHorizontalToSphere } from '../stars/skyProjection'
import type { TextureAnchor } from './constellationArtTexturePlacement'

/**
 * Hand-placed anchors for one AI-generated Leo illustration
 * (public/with_line/しし座_線あり.png, 941x1672px) — a single-constellation
 * prototype testing whether an externally-generated image can be fit onto
 * the sky sphere (constellationArtTexturePlacement.ts's
 * buildTexturedArtMeshGrid), ahead of committing to this as Phase 13 Task
 * 4's actual direction — see docs/features/phase-13-implementation-tasks.md
 * Task 4's still-open options. Deliberately separate from the
 * constellationArt catalog/type system (constellationArtTypes.ts,
 * constellationArtCatalogSource.ts) — those stay an empty placeholder until
 * the direction is confirmed and a real 88-constellation pipeline replaces
 * this one-off.
 *
 * Pixel coordinates came from thresholding the image for its own baked-in
 * star markers (a one-off script, not part of the app) and were matched to
 * real Leo stars by position and how they connect in the image, cross-
 * checked against this app's own Leo line data (constellationCatalog.json,
 * star ids from src/stars/data/hygCatalog.json). The image simplifies the
 * sickle (6 real stars) down to 2 visible points, so Adhafera/Rasalas have
 * no anchor of their own — not needed, the other 7 already cover the full
 * body well. One small, dim marker near the chest didn't match any real Leo
 * star in this app's data (likely decorative) and was left out.
 */
export const LEO_ART_PROTOTYPE = {
  imageUrl: '/with_line/しし座_線あり.png',
  imageWidthPx: 941,
  imageHeightPx: 1672,
  /**
   * The lion illustration itself sits roughly in this box; the rest of the
   * 941x1672 canvas is empty starfield margin. buildTexturedArtMeshGrid's
   * fit is only trustworthy near the anchors it was built from (x:144-824,
   * y:543-873) — this crop extrapolates modestly beyond that on every side
   * to include the mane top and legs, which testing confirmed stays well
   * within a sane result once solveLeastSquaresPlane's numerical-
   * conditioning bug was fixed (an earlier version of this crop had grid
   * corners landing 70-80° from the actual stars, which turned out to be
   * that bug, not excessive extrapolation).
   */
  pixelBounds: { minX: 10, minY: 440, maxX: 900, maxY: 1080 },
  anchors: [
    { starId: 50440, pixelX: 675.6, pixelY: 543.1 }, // Algieba — mane-top junction
    { starId: 47772, pixelX: 823.9, pixelY: 625.8 }, // Ras Elased Australis — nose/muzzle
    { starId: 54712, pixelX: 291.6, pixelY: 613.4 }, // Zosma — shoulder/back
    { starId: 49441, pixelX: 615.3, pixelY: 678.9 }, // Eta Leonis — mid-chest
    { starId: 54718, pixelX: 344.0, pixelY: 740.4 }, // Chertan — hip
    { starId: 57459, pixelX: 144.1, pixelY: 766.5 }, // Denebola — tail tip
    { starId: 49528, pixelX: 629.9, pixelY: 872.8 }, // Regulus — front leg/chest
  ],
} as const

/**
 * Resolves LEO_ART_PROTOTYPE's anchors to sky-sphere positions for the given
 * observer/instant, mirroring constellationArtProjection.ts's
 * computeConstellationArtPlacement (a separate, smaller copy rather than a
 * shared helper — this whole module goes away once the real direction is
 * decided, so it's not worth coupling to the catalog-based path for a
 * one-off). Drops below-horizon anchors, same convention as the rest of the
 * constellation-display code.
 */
export function resolveLeoArtPrototypeAnchors(
  location: ObserverLocation,
  date: Date,
): TextureAnchor[] {
  const starsById = new Map(loadHygStarCatalog().map((star) => [star.id, star]))

  const anchors: TextureAnchor[] = []
  for (const anchor of LEO_ART_PROTOTYPE.anchors) {
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
  return anchors
}
