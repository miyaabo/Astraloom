/** White is the visual baseline; blueWhite/paleOrange are rare accents (see PRODUCT.md Star Color). */
export type StarColorCategory = 'white' | 'blueWhite' | 'paleOrange'

export interface StarPosition {
  x: number
  y: number
}

export interface StarData {
  id: number
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
