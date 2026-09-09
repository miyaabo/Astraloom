import type { StarPosition } from '../stars/starTypes'

/**
 * One constellation's art image plus its pixel-coordinate anchors,
 * pre-matched to the bundled HYG catalog (src/stars/data/hygCatalog.json),
 * the same way scripts/build-constellation-catalog.mjs pre-matches line
 * segments (constellationTypes.ts's ConstellationRecord). Runtime code never
 * deals with source-specific star numbering (e.g. Hipparcos) — anchors are
 * always HYG star ids here.
 *
 * 13次 Task 4 tried two earlier drawing approaches (a full painterly texture,
 * then an auto-traced silhouette outline) and Human Check rejected both —
 * see docs/features/phase-13-implementation-tasks.md Task 4. The current
 * approach is a human-drawn no-line illustration per constellation
 * (public/no-line/), anchored to real stars via
 * scripts/build-constellation-art-catalog.mjs from hand-authored anchor data
 * (public/no-line/constellation-anchors.json).
 */
export interface ConstellationArtRecord {
  /** Unique illustration record id. Unlike the IAU abbreviation, Serpens' two entries remain distinct. */
  constellationId: string
  /**
   * `ConstellationRecord.name`s this single art record covers — not `.id`,
   * because `.id` (the IAU abbreviation) isn't unique: Serpens Caput and
   * Serpens Cauda both use "Ser" but get two separate illustrations (head
   * and tail), which `.id` alone couldn't distinguish. Usually one name, but
   * a few images may cover several historically-related constellations
   * sharing one picture (e.g. an old Argo Navis image covering Carina/
   * Puppis/Vela/Pyxis, DECISIONS.md D033) — selecting any of them would show
   * the same art unsplit, matching Stellarium's own behavior (Task 3). In
   * practice the current asset set gives every constellation its own
   * separate illustration, so this array is always length 1 today.
   */
  constellationNames: string[]
  /** Public URL path to the no-line illustration (e.g. "/no-line/xxx.png"), served from public/. */
  imageUrl: string
  /** The illustration's actual pixel dimensions, needed to normalize UVs when building the mesh grid (constellationArtTexturePlacement.ts). */
  imageWidthPx: number
  imageHeightPx: number
  /** Pixel rectangle of the actual artwork within the image (see buildTexturedArtMeshGrid's note on why this usually isn't the whole image). */
  pixelBounds: { minX: number; minY: number; maxX: number; maxY: number }
  /** Pixel-coordinate anchors used to fit the art onto the sky sphere. */
  anchors: ConstellationArtAnchor[]
  /** Authoring-only guide source and rigid placement values. */
  imagePath: string
  guideImagePath: string
  offsetX: number
  offsetY: number
  scale: number
  rotationDeg: number
  flipX: boolean
  flipY: boolean
  guideBounds: { minX: number; minY: number; maxX: number; maxY: number }
}

/** One image-pixel ⇔ star correspondence used to fit a ConstellationArtRecord's art onto the sky. */
export interface ConstellationArtAnchor {
  /** HYG catalog star id (src/stars/data/hygCatalog.json), not a source-specific star number. */
  starId: number
  pixelX: number
  pixelY: number
}

/**
 * A ConstellationArtRecord's anchors projected onto the sky sphere for a
 * given observer location/instant
 * (src/constellations/constellationArtProjection.ts), mirroring how
 * constellationProjection.ts projects line segments. Carries the surviving
 * (above-horizon) anchors — both their pixel and sphere position — which
 * whatever drawing approach is chosen next uses to fit its own art onto the
 * sphere (the removed constellationArtOutline.ts used a gnomonic
 * tangent-plane fit — affine with 3 anchors, similarity with 2 — for this;
 * likely worth rewriting rather than reviving as-is, since it fit line
 * segments specifically).
 */
export interface ConstellationArtPlacement {
  /** Anchors with an above-horizon position; below-horizon anchors are dropped, matching computeConstellationLineSegments. */
  anchors: { pixelX: number; pixelY: number; position: StarPosition }[]
}
