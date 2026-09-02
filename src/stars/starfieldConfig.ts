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
    /** Base star point-size multiplier (projector.render.pointSizeScale is the projector-mode override on top of this). */
    pointSizeScale: number
    colorCategoryColor: {
      white: string
      blueWhite: string
      paleOrange: string
    }
    celestialBodyColor: {
      moon: string
      neutral: string
      warm: string
      cool: string
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
  /**
   * Milky Way band (4次 Task 2, D018): a diffuse particle band layered onto
   * the same sky sphere as the stars, kept as a separate Points/shader (not
   * starVisualAttributes) since it has no twinkle/halo tiers of its own.
   * Values here are placeholders for the Task 2 foundation; Task 3 tunes
   * them against the Visual Target/Human Check.
   */
  milkyWay: {
    /** Number of particles making up the band. */
    particleCount: number
    /**
     * Approximate angular half-width, in degrees, of the galactic-latitude
     * scatter used to place particles around the galactic plane (b=0) — see
     * src/stars/milkyWay.ts. Larger values make a wider, more diffuse band.
     */
    bandWidthDegrees: number
    /** Rendered point size, in CSS pixels, for every particle. */
    pointSizePixels: number
    /** Max per-particle alpha at the band's brightest (center) point. */
    baseOpacity: number
    /** Particle color; kept desaturated/cool so the band reads as a soft glow, not colorful. */
    color: string
  }
  /**
   * Horizon/ground dome (4次 Task 4, D018): a simple silhouette + glow layer
   * covering the sky sphere from the horizon down to straight-down, built
   * once (not per date/location, see src/stars/horizon.ts) since the ground
   * doesn't move as the sky rotates. Values here are placeholders for the
   * Task 4 foundation; Task 5 tunes them against the Visual Target/Human Check.
   */
  horizon: {
    /** Divisions around the full 360° azimuth for the ground mesh; higher = smoother curve. */
    azimuthSegments: number
    /** Divisions from the horizon down to straight-down (nadir). */
    altitudeSegments: number
    /** How far above the horizon (0° altitude), in degrees, the glow fades out into the sky. */
    glowSpanDegrees: number
    /** Very thin brightness ridge centered on the horizon itself, to make the boundary readable without drawing a hard line. */
    rimSpanDegrees: number
    /** Solid ground silhouette color, once fully below the horizon. */
    groundColor: string
    /** Horizon glow color, blended near the horizon line. */
    glowColor: string
    /** Extra opacity for the thin horizon ridge. Kept separate so it can be reverted independently from the broader glow. */
    rimOpacity: number
    /** Max opacity of the horizon glow, right at the horizon line. */
    glowOpacity: number
    /** Opacity of the solid ground silhouette once fully below the horizon. */
    groundOpacity: number
  }
  projector: {
    render: {
      backgroundColor: string
      pointSizeScale: number
      haloIntensityMultiplier: number
      milkyWayOpacityMultiplier: number
      horizonGlowColor: string
      horizonGlowOpacityMultiplier: number
      horizonRimOpacityMultiplier: number
      constellationLineOpacityMultiplier: number
    }
    overlay: {
      border: string
      controlBackground: string
      panelBackground: string
      text: string
    }
  }
  /**
   * Night Mode UI (10次 Task 3, D029): overlay-chrome-only colors for
   * pre-sleep use, independent of projector mode (never touches star
   * rendering). Muted/warm relative to the default overlay palette so it
   * reads as dimmer without introducing a distracting hue.
   */
  nightModeUi: {
    overlay: {
      border: string
      controlBackground: string
      panelBackground: string
      text: string
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
    pointSizeScale: 1,
    colorCategoryColor: {
      white: '#ffffff',
      blueWhite: '#cfe0ff',
      paleOrange: '#ffdcb0',
    },
    celestialBodyColor: {
      moon: '#eee8d6',
      neutral: '#f3ead2',
      warm: '#f2cfac',
      cool: '#d3def6',
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
  milkyWay: {
    particleCount: 14000,
    bandWidthDegrees: 9,
    pointSizePixels: 5,
    baseOpacity: 0.18,
    color: '#9fb3d9',
  },
  horizon: {
    azimuthSegments: 96,
    altitudeSegments: 24,
    glowSpanDegrees: 7,
    rimSpanDegrees: 1.6,
    groundColor: '#02050d',
    glowColor: '#23365e',
    rimOpacity: 0.18,
    glowOpacity: 0.16,
    groundOpacity: 0.72,
  },
  projector: {
    render: {
      backgroundColor: '#0a0d16',
      pointSizeScale: 1.08,
      haloIntensityMultiplier: 0.92,
      milkyWayOpacityMultiplier: 1.18,
      horizonGlowColor: '#314a7a',
      horizonGlowOpacityMultiplier: 1.35,
      horizonRimOpacityMultiplier: 1.2,
      constellationLineOpacityMultiplier: 0.82,
    },
    overlay: {
      border: 'rgba(255, 255, 255, 0.2)',
      controlBackground: 'rgba(3, 5, 10, 0.38)',
      panelBackground: 'rgba(3, 5, 10, 0.68)',
      text: '#f5f7ff',
    },
  },
  nightModeUi: {
    overlay: {
      border: 'rgba(255, 214, 173, 0.15)',
      controlBackground: 'rgba(10, 6, 4, 0.6)',
      panelBackground: 'rgba(10, 6, 4, 0.88)',
      text: '#d9b98f',
    },
  },
}
