/**
 * Central tuning point for starfield data/visual parameters (see DECISIONS.md D004).
 * Extend this object as later tasks add rendering knobs (glow, halo, background, DPR cap, etc.)
 * instead of scattering magic numbers across the codebase.
 */
export interface StarfieldConfig {
  camera: {
    /** Vertical field of view, in degrees, for the sky-sphere PerspectiveCamera (D014). */
    fovDegrees: number
  }
  controls: {
    drag: {
      /** Camera yaw/pitch rotation, in degrees, per pixel of drag movement (D014: drag-only view control). */
      degreesPerPixel: number
      /** Clamp on how far up/down the view can pitch, in degrees, so it can't flip past looking straight up/down. */
      pitchLimitDegrees: number
    }
    zoom: {
      minFovDegrees: number
      maxFovDegrees: number
      /** FOV change, in degrees, per unit of wheel/trackpad deltaY. */
      wheelDegreesPerUnit: number
      /** FOV change, in degrees, per pixel of two-finger pinch distance change. */
      pinchDegreesPerPixel: number
    }
    tap: {
      /** Max pointer movement, in px, between pointerdown/up for a gesture to still count as a tap/click rather than a drag (Task 5). */
      maxMovementPixels: number
      /** Hit-test radius, in px, around a tap/click position for selecting a star (Task 5) — wider than the star's rendered point size for comfortable touch accuracy. */
      hitRadiusPixels: number
    }
  }
  brightness: {
    min: number
    max: number
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
    /** Camera sway amplitude, in radians, for the gentle overall drift (PRODUCT.md Motion; a small yaw/pitch sway since D014's PerspectiveCamera lives at the origin). */
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
    constellationLines: {
      /** Line color; kept cool/subtle so lines read as a guide, not a bright overlay (D017). */
      color: string
      /** Opacity; low so lines never compete with the stars for attention. */
      opacity: number
    }
  }
}

export const starfieldConfig: StarfieldConfig = {
  camera: {
    fovDegrees: 70,
  },
  controls: {
    drag: {
      degreesPerPixel: 0.15,
      pitchLimitDegrees: 85,
    },
    zoom: {
      minFovDegrees: 30,
      maxFovDegrees: 90,
      wheelDegreesPerUnit: 0.03,
      pinchDegreesPerPixel: 0.2,
    },
    tap: {
      maxMovementPixels: 10,
      hitRadiusPixels: 20,
    },
  },
  brightness: {
    min: 0,
    max: 1,
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
    constellationLines: {
      color: '#8fa8d9',
      opacity: 0.35,
    },
  },
}
