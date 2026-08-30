import type { StarPosition } from '../stars/starTypes'

/**
 * One constellation from the d3-celestial dataset (DECISIONS.md D015),
 * pre-matched to the bundled HYG catalog (src/stars/data/hygCatalog.json) by
 * scripts/build-constellation-catalog.mjs. Line rendering and selection UI
 * are later layers (phase-3-implementation-tasks.md Task 3+), not this type.
 */
export interface ConstellationRecord {
  /** IAU abbreviation, e.g. "And". Not unique — Serpens splits into two
   * features (Caput/Cauda) sharing this id, distinguished by `name`. */
  id: string
  /** d3-celestial's `name` property, e.g. "Andromeda", "Serpens Caput". */
  name: string
  /** d3-celestial's `ja` property, e.g. "アンドロメダ座". Used for on-screen display (Task 4). */
  nameJa: string
  /** Line segments as pairs of HYG star ids (src/stars/data/hygCatalog.json). */
  segments: [number, number][]
}

/**
 * One line segment of a constellation, projected onto the sky sphere for a
 * given observer location/instant (Task 3, src/constellations/constellationProjection.ts).
 * Kept separate from StarPosition-bearing StarData since these points aren't
 * individually rendered stars — they're just line endpoints.
 */
export interface ConstellationLineSegment {
  start: StarPosition
  end: StarPosition
}

/**
 * One named star within a constellation, projected onto the sky sphere for a
 * given observer location/instant (Task 4,
 * src/constellations/constellationProjection.ts). Only stars with a proper
 * name (src/stars/starTypes.ts) produce a label.
 */
export interface ConstellationStarLabel {
  starId: number
  properName: string
  position: StarPosition
}
