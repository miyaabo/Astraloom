import * as THREE from 'three'
import { starfieldConfig } from '../stars/starfieldConfig'
import type { StarData } from '../stars/starTypes'
import { watchReducedMotion } from './reducedMotion'
import { watchVisibility } from './visibility'

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
    positions[i * 3 + 2] = 0

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
 * (normalized -1..1 position) and star visual attributes (color/size/
 * brightness) come in as data; this class only turns that data into pixels.
 */
export class StarfieldRenderer {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene: THREE.Scene
  private readonly camera: THREE.OrthographicCamera
  private readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly unwatchReducedMotion: () => void
  private readonly unwatchVisibility: () => void

  private reducedMotionScale = 1
  private rafId: number | null = null
  private startTimeMs = 0
  private isVisible = true
  /** Whether start() has been requested (independent of whether the rAF loop is actually running, which also depends on tab visibility). */
  private running = false

  constructor(canvas: HTMLCanvasElement, stars: StarData[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setClearColor(starfieldConfig.render.backgroundColor, 1)

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    this.camera.position.z = 1

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
   * Recomputes the camera frustum for the new size and redraws one frame.
   * Star position data fills a [-1, 1] square (see starDataSource); the
   * frustum is sized to "cover" the viewport from that square (cropping the
   * longer axis) rather than "contain" it, so no empty margin appears on
   * non-square viewports.
   */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return

    const aspect = width / height
    if (aspect >= 1) {
      this.camera.left = -1
      this.camera.right = 1
      this.camera.top = 1 / aspect
      this.camera.bottom = -1 / aspect
    } else {
      this.camera.left = -aspect
      this.camera.right = aspect
      this.camera.top = 1
      this.camera.bottom = -1
    }
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

    this.startTimeMs = performance.now()
    const loop = (nowMs: number) => {
      this.update((nowMs - this.startTimeMs) / 1000)
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
   * circular camera pan — see PRODUCT.md Motion / starfieldConfig.motion).
   * Both are scaled down, not stopped, under prefers-reduced-motion.
   */
  private update(elapsedSeconds: number): void {
    const { uniforms } = this.points.material
    uniforms.uTime.value = elapsedSeconds
    uniforms.uReducedMotionScale.value = this.reducedMotionScale

    const { driftAmplitude, driftSpeed } = starfieldConfig.motion
    const angle = elapsedSeconds * driftSpeed
    const radius = driftAmplitude * this.reducedMotionScale
    this.camera.position.x = Math.sin(angle) * radius
    this.camera.position.y = Math.cos(angle) * radius
  }

  dispose(): void {
    this.stop()
    this.unwatchReducedMotion()
    this.unwatchVisibility()
    this.points.geometry.dispose()
    this.points.material.dispose()
    this.renderer.dispose()
  }
}
