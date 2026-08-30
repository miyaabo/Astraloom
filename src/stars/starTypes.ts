/** White is the visual baseline; blueWhite/paleOrange are rare accents (see PRODUCT.md Star Color). */
export type StarColorCategory = 'white' | 'blueWhite' | 'paleOrange'

/** A point on the sky sphere (world units), centered on the observer at the origin. See skyProjection.ts. */
export interface StarPosition {
  x: number
  y: number
  z: number
}

export interface StarData {
  id: number
  /** The underlying HygStarRecord.id this star was derived from (Task 5) — lets a tap/click selection look up the star's real magnitude, color index, proper name, and constellation membership, none of which survive into the placement/appearance fields below. */
  hygId: number
  position: StarPosition
  /** Pseudo brightness/magnitude-like value, 0 (dim) – 1 (bright). */
  brightness: number
  colorCategory: StarColorCategory
  /** Radians; offsets twinkle animation per star so stars don't blink in sync. */
  twinklePhase: number
  /** Twinkle magnitude, 0 (none) – 1 (max); correlated with brightness. */
  twinkleAmplitude: number
  /** Relative size variance, 0 – 1, layered on top of the brightness-driven base size. */
  sizeVariance: number
}

/**
 * One star from the HYG Database catalog (DECISIONS.md D013), pre-filtered to
 * magnitude <= 6.5 by scripts/build-hyg-catalog.mjs. Equatorial coordinates
 * only — alt/az projection and screen placement are later layers (see
 * docs/features/phase-1-implementation-tasks.md Task 3/4), not this type.
 */
export interface HygStarRecord {
  /** HYG catalog id. */
  id: number
  /** Right ascension, hours (0–24). */
  raHours: number
  /** Declination, degrees (-90–90). */
  decDegrees: number
  /** Apparent visual magnitude. */
  magnitude: number
  /** B-V color index; null when the catalog has no measurement for this star. */
  colorIndex: number | null
  /** Proper name (e.g. "Sirius"); null for the vast majority of stars that don't have one. */
  properName: string | null
}
