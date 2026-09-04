import type { StarPosition } from '../stars/starTypes'

/**
 * One constellation's art anchors: pixel-coordinate points in a not-yet-
 * chosen source image, pre-matched to the bundled HYG catalog
 * (src/stars/data/hygCatalog.json), the same way
 * scripts/build-constellation-catalog.mjs pre-matches line segments
 * (constellationTypes.ts's ConstellationRecord). Runtime code never deals
 * with source-specific star numbering (e.g. Hipparcos) — anchors are always
 * HYG star ids here.
 *
 * 13次 Task 4 tried two drawing approaches on top of this (a full painterly
 * texture, then an auto-traced silhouette outline) and Human Check rejected
 * both — see docs/features/phase-13-implementation-tasks.md Task 4. This
 * type only keeps what's independent of that unresolved drawing question:
 * which stars anchor which pixel position. Whatever art approach is chosen
 * next (see the task file's open options) adds its own payload here (e.g. an
 * image reference) rather than assuming line-segment output.
 */
export interface ConstellationArtRecord {
  /**
   * `ConstellationRecord.id`s this single art record covers. Usually one, but
   * a few images may cover several modern IAU constellations split from one
   * historical figure (e.g. the old Argo Navis image covers Car/Pup/Vel,
   * DECISIONS.md D033) — selecting any of them shows the same art unsplit,
   * matching Stellarium's own behavior (Task 3).
   */
  constellationIds: string[]
  /** Pixel-coordinate anchors used to fit the art onto the sky sphere. */
  anchors: ConstellationArtAnchor[]
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
