/**
 * Central tuning point for starfield data/visual parameters (see DECISIONS.md D004).
 * Extend this object as later tasks add rendering knobs (glow, halo, background, DPR cap, etc.)
 * instead of scattering magic numbers across the codebase.
 */
export interface StarfieldConfig {
  /** Number of stars to generate; PRODUCT.md targets a few thousand to ~10000. */
  starCount: number
  brightness: {
    min: number
    max: number
    /** Exponent applied to a uniform random value; >1 skews the population toward dim stars. */
    curvePower: number
  }
  /** Selection weights for colorCategory; must sum to 1. */
  colorCategoryWeights: {
    white: number
    blueWhite: number
    paleOrange: number
  }
  twinkle: {
    minAmplitude: number
    maxAmplitude: number
    /** Exponent applied to brightness so only brighter stars get a noticeable twinkle. */
    amplitudeBrightnessPower: number
    /** Radians/sec added to each star's phase; one global speed keeps the shimmer pace consistent. */
    speed: number
  }
  sizeVariance: {
    min: number
    max: number
  }
  motion: {
    /** Camera pan radius, in NDC units, for the gentle overall drift (PRODUCT.md Motion). */
    driftAmplitude: number
    /** Radians/sec the camera sweeps around the drift circle. */
    driftSpeed: number
    /** Multiplier applied to twinkle/drift amplitude under prefers-reduced-motion; attenuates rather than stops motion. */
    reducedMotionScale: number
  }
  render: {
    /** Dark, calm blue-black background (see PRODUCT.md Background / D011). */
    backgroundColor: string
    /** Caps devicePixelRatio to bound GPU/fill-rate cost on high-DPR phones (see PRODUCT.md Mobile / D006). */
    dprCap: number
    pointSizePixels: {
      min: number
      max: number
    }
    colorCategoryColor: {
      white: string
      blueWhite: string
      paleOrange: string
    }
    halo: {
      /**
       * Brightness (0-1) above which a halo starts to appear. Keeps glow
       * limited to only the brightest stars, per PRODUCT.md Glow/Halo.
       */
      brightnessThreshold: number
      /** Exponent shaping the ramp above the threshold; >1 keeps the ramp gentle at first. */
      power: number
      /** How much larger than the core the halo sprite extends, as a multiplier of core size. */
      radiusMultiplier: number
      /** Maximum halo opacity contribution at brightness 1; kept low to avoid a neon look. */
      intensity: number
    }
  }
}

export const starfieldConfig: StarfieldConfig = {
  starCount: 6000,
  brightness: {
    min: 0,
    max: 1,
    curvePower: 2.4,
  },
  colorCategoryWeights: {
    white: 0.8,
    blueWhite: 0.12,
    paleOrange: 0.08,
  },
  twinkle: {
    minAmplitude: 0,
    maxAmplitude: 0.35,
    amplitudeBrightnessPower: 1.5,
    speed: 1.1,
  },
  sizeVariance: {
    min: 0,
    max: 1,
  },
  motion: {
    driftAmplitude: 0.012,
    driftSpeed: 0.05,
    reducedMotionScale: 0.15,
  },
  render: {
    backgroundColor: '#05070f',
    dprCap: 2,
    pointSizePixels: {
      min: 1.1,
      max: 3.2,
    },
    colorCategoryColor: {
      white: '#ffffff',
      blueWhite: '#cfe0ff',
      paleOrange: '#ffdcb0',
    },
    halo: {
      brightnessThreshold: 0.75,
      power: 1.8,
      radiusMultiplier: 3.5,
      intensity: 0.55,
    },
  },
}
