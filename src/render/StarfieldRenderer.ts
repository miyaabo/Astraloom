import * as THREE from 'three'
import type { ConstellationLineSegment } from '../constellations/constellationTypes'
import { DEG_TO_RAD, clamp, normalizeDegrees } from '../mathUtils'
import { SKY_SPHERE_RADIUS } from '../stars/skyProjection'
import { starfieldConfig } from '../stars/starfieldConfig'
import type { StarData, StarPosition } from '../stars/starTypes'
import { watchReducedMotion } from './reducedMotion'
import { findNearestScreenPoint, projectToScreen } from './screenProjection'
import { watchVisibility } from './visibility'

/** A named point (constellation name anchor, star proper name) to track on screen (Task 4). */
export interface LabelTarget {
  key: string
  position: StarPosition
}

/** A label's current on-screen position, keyed to match its LabelTarget. */
export interface LabelScreenPosition {
  key: string
  xPercent: number
  yPercent: number
  visible: boolean
}

const CAMERA_NEAR = 0.1
const CAMERA_FAR = SKY_SPHERE_RADIUS * 2

/** Below this on-screen distance (px), a lower-priority label is hidden rather than drawn overlapping a higher-priority one — see updateLabelPositions(). Tuned by eye against typical label text size (12-15px font). */
const LABEL_THINNING_RADIUS_PIXELS = 28

/**
 * Sharp core + soft halo point shader (Task 4), plus per-star twinkle (Task 5).
 * The point sprite is sized to fit the core plus, for only the brightest
 * stars, a halo extending beyond it (see starfieldConfig.render.halo) — dim/mid
 * stars get no halo, keeping the "small sharp point" look from PRODUCT.md's
 * Planetarium-like principle. Twinkle modulates final alpha only (not size or
 * halo) so brightness flicker never reads as pulsing/growing stars.
 */
const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aBrightness;
  attribute float aTwinklePhase;
  attribute float aTwinkleAmplitude;

  uniform float uHaloThreshold;
  uniform float uHaloPower;
  uniform float uHaloRadiusMultiplier;
  uniform float uHaloIntensity;
  uniform float uTime;
  uniform float uTwinkleSpeed;
  uniform float uReducedMotionScale;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vCoreRadius;
  varying float vHaloStrength;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vBrightness = aBrightness;

    float haloAmount = pow(
      clamp((aBrightness - uHaloThreshold) / (1.0 - uHaloThreshold), 0.0, 1.0),
      uHaloPower
    );
    vHaloStrength = haloAmount * uHaloIntensity;

    vTwinkle = 1.0 + sin(uTime * uTwinkleSpeed + aTwinklePhase) *
      aTwinkleAmplitude * uReducedMotionScale;

    float sizeMultiplier = mix(1.0, uHaloRadiusMultiplier, haloAmount);
    // Core stays a constant fraction of the (possibly enlarged) point sprite
    // so its on-screen size always matches aSize, regardless of halo size.
    vCoreRadius = 0.5 / sizeMultiplier;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * sizeMultiplier;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  varying float vCoreRadius;
  varying float vHaloStrength;
  varying float vTwinkle;

  void main() {
    vec2 fromCenter = gl_PointCoord - vec2(0.5);
    float dist = length(fromCenter);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(vCoreRadius * 0.7, vCoreRadius, dist);
    core = clamp(core, 0.0, 1.0);

    float haloFalloff = 1.0 - smoothstep(vCoreRadius, 0.5, dist);
    float halo = haloFalloff * haloFalloff * vHaloStrength;

    float alpha = clamp(core + halo, 0.0, 1.0) * mix(0.45, 1.0, vBrightness);
    alpha = clamp(alpha * vTwinkle, 0.0, 1.0);
    gl_FragColor = vec4(vColor, alpha);
  }
`

function buildStarGeometry(stars: StarData[]): THREE.BufferGeometry {
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const sizes = new Float32Array(stars.length)
  const brightnesses = new Float32Array(stars.length)
  const twinklePhases = new Float32Array(stars.length)
  const twinkleAmplitudes = new Float32Array(stars.length)

  const { min: sizeMin, max: sizeMax } = starfieldConfig.render.pointSizePixels
  const color = new THREE.Color()

  stars.forEach((star, i) => {
    positions[i * 3] = star.position.x
    positions[i * 3 + 1] = star.position.y
    positions[i * 3 + 2] = star.position.z

    color.set(starfieldConfig.render.colorCategoryColor[star.colorCategory])
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    const baseSize = THREE.MathUtils.lerp(sizeMin, sizeMax, star.brightness)
    sizes[i] = baseSize * (0.85 + star.sizeVariance * 0.3)

    brightnesses[i] = star.brightness
    twinklePhases[i] = star.twinklePhase
    twinkleAmplitudes[i] = star.twinkleAmplitude
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute(
    'aBrightness',
    new THREE.BufferAttribute(brightnesses, 1),
  )
  geometry.setAttribute(
    'aTwinklePhase',
    new THREE.BufferAttribute(twinklePhases, 1),
  )
  geometry.setAttribute(
    'aTwinkleAmplitude',
    new THREE.BufferAttribute(twinkleAmplitudes, 1),
  )
  return geometry
}

/**
 * Owns the Three.js scene/camera/points for the starfield. Star placement
 * (a position on the sky sphere, see skyProjection.ts) and star visual
 * attributes (color/size/brightness) come in as data; this class only turns
 * that data into pixels.
 */
export class StarfieldRenderer {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly points: THREE.Points<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >
  private readonly constellationLines: THREE.LineSegments<
    THREE.BufferGeometry,
    THREE.LineBasicMaterial
  >
  private readonly unwatchReducedMotion: () => void
  private readonly unwatchVisibility: () => void
  private readonly onHeadingChange?: (headingDegrees: number) => void
  private readonly onLabelPositionsChange?: (
    positions: LabelScreenPosition[],
  ) => void
  private readonly onZoomChange?: (fovDegrees: number) => void

  private reducedMotionScale = 1
  /** Current canvas size in device-independent pixels (set by resize()), used to convert label positions from percent to pixels for the on-screen-collision thinning in updateLabelPositions(). */
  private canvasWidthPx = 0
  private canvasHeightPx = 0
  private rafId: number | null = null
  /** Seconds of animation time accrued so far; frozen while the loop is stopped so a hidden-tab pause/resume doesn't snap the drift phase (see startLoop). */
  private elapsedSeconds = 0
  private isVisible = true
  /** User-controlled look direction (Task 3 drag input), separate from the ambient drift applied on top each frame in update(). */
  private userYawRadians = 0
  private userPitchRadians = 0
  /** Whether start() has been requested (independent of whether the rAF loop is actually running, which also depends on tab visibility). */
  private running = false
  /** Points currently tracked for on-screen labels (Task 4), set via setLabelTargets. */
  private labelTargets: LabelTarget[] = []
  /** The star data currently rendered, kept for tap/click hit-testing (Task 5, see hitTestStar) — not otherwise needed after buildStarGeometry consumes it. */
  private stars: StarData[]

  constructor(
    canvas: HTMLCanvasElement,
    stars: StarData[],
    onHeadingChange?: (headingDegrees: number) => void,
    onLabelPositionsChange?: (positions: LabelScreenPosition[]) => void,
    onZoomChange?: (fovDegrees: number) => void,
  ) {
    this.onHeadingChange = onHeadingChange
    this.onLabelPositionsChange = onLabelPositionsChange
    this.onZoomChange = onZoomChange
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setClearColor(starfieldConfig.render.backgroundColor, 1)

    this.scene = new THREE.Scene()
    // Aspect is a placeholder; the ResizeObserver in Starfield.tsx calls
    // resize() immediately on observe(), before the first real frame.
    this.camera = new THREE.PerspectiveCamera(
      starfieldConfig.camera.fovDegrees,
      1,
      CAMERA_NEAR,
      CAMERA_FAR,
    )
    // Yaw (Y) applied before pitch (X) so dragging diagonally never
    // introduces unwanted roll — the standard order for a look-around camera.
    this.camera.rotation.order = 'YXZ'

    this.stars = stars
    const geometry = buildStarGeometry(stars)
    const { halo } = starfieldConfig.render
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uHaloThreshold: { value: halo.brightnessThreshold },
        uHaloPower: { value: halo.power },
        uHaloRadiusMultiplier: { value: halo.radiusMultiplier },
        uHaloIntensity: { value: halo.intensity },
        uTime: { value: 0 },
        uTwinkleSpeed: { value: starfieldConfig.twinkle.speed },
        uReducedMotionScale: { value: 1 },
      },
    })
    this.points = new THREE.Points(geometry, material)
    this.scene.add(this.points)

    // Hidden by default (D017: constellation lines only appear once a
    // constellation is selected — see showConstellationLines/Task 5).
    this.constellationLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: starfieldConfig.render.constellationLines.color,
        transparent: true,
        opacity: starfieldConfig.render.constellationLines.opacity,
        depthWrite: false,
      }),
    )
    this.constellationLines.visible = false
    this.scene.add(this.constellationLines)

    this.unwatchReducedMotion = watchReducedMotion((reduced) => {
      this.reducedMotionScale = reduced
        ? starfieldConfig.motion.reducedMotionScale
        : 1
    })

    this.unwatchVisibility = watchVisibility((visible) => {
      this.isVisible = visible
      if (visible) {
        if (this.running) this.startLoop()
      } else {
        this.stopLoop()
      }
    })
  }

  /**
   * Recomputes the camera aspect ratio for the new size and redraws one
   * frame. Vertical field of view stays fixed (starfieldConfig.camera); only
   * the horizontal extent adjusts, matching how a real lens/eye behaves.
   */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return

    this.canvasWidthPx = width
    this.canvasHeightPx = height
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const pixelRatio = Math.min(
      window.devicePixelRatio,
      starfieldConfig.render.dprCap,
    )
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.render()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Applies a drag-driven look change (Task 3 / D014). Pitch is clamped so
   * the view can't flip past straight up/down; yaw is unbounded (full circle
   * look-around). Takes effect on the next update()/render() frame.
   */
  rotateBy(deltaYawDegrees: number, deltaPitchDegrees: number): void {
    const { pitchLimitDegrees } = starfieldConfig.controls.drag
    const pitchLimitRadians = pitchLimitDegrees * DEG_TO_RAD

    this.userYawRadians += deltaYawDegrees * DEG_TO_RAD
    this.userPitchRadians = clamp(
      this.userPitchRadians + deltaPitchDegrees * DEG_TO_RAD,
      -pitchLimitRadians,
      pitchLimitRadians,
    )
  }

  /**
   * The compass direction (0-360°, matching the azimuth convention in
   * skyProjection.ts: 0=north, 90=east) the camera currently looks toward.
   * Derived from camera.rotation.y, which is the inverse of azimuth (see
   * projectHorizontalToSphere: increasing azimuth rotates the view the
   * opposite way rotation.y does).
   */
  getHeadingDegrees(): number {
    return normalizeDegrees(-THREE.MathUtils.radToDeg(this.camera.rotation.y))
  }

  /**
   * Points the camera at a given horizontal direction (Task 6: search result
   * selection moves the view there) — the inverse of the alt/az → XYZ
   * convention in projectHorizontalToSphere, and consistent with
   * getHeadingDegrees's yaw↔azimuth relationship. Like rotateBy, this only
   * sets the user-controlled yaw/pitch; ambient drift keeps layering on top
   * each frame (update()), and pitch is clamped the same way drag input is.
   */
  lookAt(azimuthDegrees: number, altitudeDegrees: number): void {
    const { pitchLimitDegrees } = starfieldConfig.controls.drag
    const pitchLimitRadians = pitchLimitDegrees * DEG_TO_RAD

    this.userYawRadians = -azimuthDegrees * DEG_TO_RAD
    this.userPitchRadians = clamp(
      altitudeDegrees * DEG_TO_RAD,
      -pitchLimitRadians,
      pitchLimitRadians,
    )
    this.render()
  }

  /** Adjusts zoom via field of view (D014), clamped to starfieldConfig.controls.zoom's range. */
  zoomBy(deltaFovDegrees: number): void {
    const { minFovDegrees, maxFovDegrees } = starfieldConfig.controls.zoom
    this.camera.fov = clamp(
      this.camera.fov + deltaFovDegrees,
      minFovDegrees,
      maxFovDegrees,
    )
    this.camera.updateProjectionMatrix()
    // Zooming changes how far apart labels land on screen (Design Backlog:
    // 星座線/ラベルの見た目改善), so whoever is tracking label positions
    // (ConstellationLabelsOverlay's vertical-shift declutter) needs to
    // re-measure instead of reusing offsets computed at the old zoom level.
    this.onZoomChange?.(this.camera.fov)
  }

  /**
   * Swaps in newly computed star placement/attributes (e.g. after a date/time
   * change, Task 5) without recreating the WebGL context. Renders one frame
   * immediately so the change is visible even while the rAF loop is paused
   * (hidden tab, reduced motion at rest).
   */
  updateStars(stars: StarData[]): void {
    this.stars = stars
    const newGeometry = buildStarGeometry(stars)
    this.points.geometry.dispose()
    this.points.geometry = newGeometry
    this.render()
  }

  /**
   * Finds the currently-rendered star nearest a tap/click position (Task 5),
   * within starfieldConfig.controls.tap.hitRadiusPixels. `canvasRect` is the
   * canvas's current bounding rect (`getBoundingClientRect()`), used to turn
   * the pointer's viewport-relative client coordinates into a position
   * relative to the canvas itself before projecting.
   */
  hitTestStar(
    clientX: number,
    clientY: number,
    canvasRect: { left: number; top: number; width: number; height: number },
  ): StarData | null {
    const pointerXPercent =
      ((clientX - canvasRect.left) / canvasRect.width) * 100
    const pointerYPercent =
      ((clientY - canvasRect.top) / canvasRect.height) * 100

    return findNearestScreenPoint(
      this.camera,
      this.stars,
      (star) => star.position,
      pointerXPercent,
      pointerYPercent,
      canvasRect.width,
      canvasRect.height,
      starfieldConfig.controls.tap.hitRadiusPixels,
    )
  }

  /**
   * Shows one constellation's line segments (Task 3), replacing whatever was
   * previously shown. Only one constellation is ever shown at a time (D017);
   * callers are responsible for deciding which one (Task 5's selection).
   */
  showConstellationLines(segments: ConstellationLineSegment[]): void {
    const positions = new Float32Array(segments.length * 6)
    segments.forEach((segment, i) => {
      positions[i * 6] = segment.start.x
      positions[i * 6 + 1] = segment.start.y
      positions[i * 6 + 2] = segment.start.z
      positions[i * 6 + 3] = segment.end.x
      positions[i * 6 + 4] = segment.end.y
      positions[i * 6 + 5] = segment.end.z
    })

    const newGeometry = new THREE.BufferGeometry()
    newGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    )
    this.constellationLines.geometry.dispose()
    this.constellationLines.geometry = newGeometry
    this.constellationLines.visible = segments.length > 0
    this.render()
  }

  /** Hides whatever constellation lines are currently shown (D017 default state). */
  hideConstellationLines(): void {
    this.constellationLines.visible = false
    this.render()
  }

  /**
   * Sets the points (constellation name anchor, named stars) an HTML overlay
   * should track on screen (Task 4). Replaces whatever was previously
   * tracked; pass an empty array to stop tracking. Positions are recomputed
   * every frame in update() so labels keep up with camera drift/drag, but
   * this also reports once immediately so the overlay doesn't wait a frame.
   */
  setLabelTargets(targets: LabelTarget[]): void {
    this.labelTargets = targets
    this.updateLabelPositions()
  }

  /**
   * Projects with the same `camera` used for the actual render — including
   * its ambient drift sway (see update()) — so a label always lands exactly
   * on the star/line it names. A prior version projected with a second,
   * drift-free camera to keep labels visually still at rest, but that made
   * labels and their stars drift apart from each other over time (the drift
   * is small per frame but doesn't cancel out — see starfieldConfig.motion);
   * that read as labels being in the wrong place, which is worse than the
   * subtle motion it was meant to fix. If "labels don't sway" is wanted
   * again, it needs to also freeze that sway for the stars/lines themselves
   * (a product decision, not a rendering-layer one).
   *
   * Also thins out labels that would visually collide (Design Backlog: dense
   * constellations could show several star-name labels crowded close
   * together, especially at a wide FOV where the whole figure fits in a
   * small area of the screen). `labelTargets` is priority-ordered by its
   * caller (Starfield.tsx puts the constellation name first, then stars
   * brightest-first) — a lower-priority label within
   * LABEL_THINNING_RADIUS_PIXELS of an already-accepted label is marked
   * `visible: false` instead of being drawn on top of it.
   * ConstellationLabelsOverlay's own vertical-shift declutter then only has
   * to spread out whatever's left, and already skips non-visible labels.
   * This runs every frame (cheap: just percent→pixel distance checks, no DOM
   * reads) so it stays correct as the view zooms in/out.
   */
  private updateLabelPositions(): void {
    if (!this.onLabelPositionsChange) return

    const projections = this.labelTargets.map((target) => ({
      key: target.key,
      ...projectToScreen(this.camera, target.position),
    }))

    const accepted: LabelScreenPosition[] = []
    for (const projection of projections) {
      if (!projection.visible) continue

      const collidesWithHigherPriority = accepted.some((other) => {
        const dxPixels =
          ((projection.xPercent - other.xPercent) / 100) * this.canvasWidthPx
        const dyPixels =
          ((projection.yPercent - other.yPercent) / 100) * this.canvasHeightPx
        return Math.hypot(dxPixels, dyPixels) < LABEL_THINNING_RADIUS_PIXELS
      })

      if (collidesWithHigherPriority) {
        projection.visible = false
      } else {
        accepted.push(projection)
      }
    }

    this.onLabelPositionsChange(projections)
  }

  /**
   * Requests the continuous animation loop (twinkle + drift). Safe to call
   * once; a second call is a no-op. While the tab is hidden, the request is
   * remembered but the rAF loop stays paused until visibility returns (see
   * the watchVisibility callback above).
   */
  start(): void {
    this.running = true
    if (this.isVisible) this.startLoop()
  }

  stop(): void {
    this.running = false
    this.stopLoop()
  }

  private startLoop(): void {
    if (this.rafId !== null) return

    // Anchor to elapsedSeconds already accrued (0 on first start) rather than
    // resetting to 0, so a hidden-tab stop/restart resumes the drift/twinkle
    // phase where it left off instead of jumping back to angle 0.
    const startReferenceMs = performance.now() - this.elapsedSeconds * 1000
    const loop = (nowMs: number) => {
      this.elapsedSeconds = (nowMs - startReferenceMs) / 1000
      this.update(this.elapsedSeconds)
      this.render()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private stopLoop(): void {
    if (this.rafId === null) return
    cancelAnimationFrame(this.rafId)
    this.rafId = null
  }

  /**
   * Advances twinkle (shader uTime) and the gentle overall drift (a small
   * camera yaw/pitch sway — see PRODUCT.md Motion / starfieldConfig.motion),
   * layered on top of the user's drag-controlled look direction (Task 3) so
   * ambient motion continues no matter where the user is looking. The
   * camera stays at the origin (D014: it represents the observer's eye,
   * with stars fixed on the sky sphere around it), so drift is a rotation
   * rather than a position pan. Both are scaled down, not stopped, under
   * prefers-reduced-motion.
   */
  private update(elapsedSeconds: number): void {
    const { uniforms } = this.points.material
    uniforms.uTime.value = elapsedSeconds
    uniforms.uReducedMotionScale.value = this.reducedMotionScale

    const { driftAmplitude, driftSpeed } = starfieldConfig.motion
    const angle = elapsedSeconds * driftSpeed
    const amplitude = driftAmplitude * this.reducedMotionScale
    this.camera.rotation.y = this.userYawRadians + Math.sin(angle) * amplitude
    this.camera.rotation.x = this.userPitchRadians + Math.cos(angle) * amplitude
    this.onHeadingChange?.(this.getHeadingDegrees())
    if (this.labelTargets.length > 0) this.updateLabelPositions()
  }

  dispose(): void {
    this.stop()
    this.unwatchReducedMotion()
    this.unwatchVisibility()
    this.points.geometry.dispose()
    this.points.material.dispose()
    this.constellationLines.geometry.dispose()
    this.constellationLines.material.dispose()
    this.renderer.dispose()
  }
}
