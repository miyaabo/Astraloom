import { starfieldConfig } from './starfieldConfig'

/**
 * Twinkle amplitude scales with brightness (brighter stars twinkle more
 * noticeably). Shared by data sources so they stay in sync with
 * starfieldConfig instead of duplicating the formula (D004).
 */
export function deriveTwinkleAmplitude(brightness: number): number {
  const { minAmplitude, maxAmplitude, amplitudeBrightnessPower } =
    starfieldConfig.twinkle
  return (
    minAmplitude +
    Math.pow(brightness, amplitudeBrightnessPower) *
      (maxAmplitude - minAmplitude)
  )
}

/** Deterministic pseudo-random value in [0, 1), seeded by a stable star id. */
function seededUnitRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Twinkle phase derived from the star's stable catalog id rather than
 * Math.random(), so it stays fixed across date/location recomputes instead
 * of reshuffling (and visibly jumping mid-twinkle) every time the observer
 * changes (Task 5/6 recompute on every date/time or location edit).
 */
export function deriveTwinklePhase(starId: number): number {
  return seededUnitRandom(starId * 12.9898) * Math.PI * 2
}

/** Same stability rationale as deriveTwinklePhase, applied to size variance. */
export function deriveSizeVariance(starId: number): number {
  const { min, max } = starfieldConfig.sizeVariance
  return min + seededUnitRandom(starId * 78.233 + 1) * (max - min)
}
