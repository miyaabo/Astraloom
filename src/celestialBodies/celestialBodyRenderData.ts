import { clamp } from '../mathUtils'
import { projectHorizontalToSphere } from '../stars/skyProjection'
import { starfieldConfig } from '../stars/starfieldConfig'
import {
  findCelestialBodyDefinition,
  type CelestialBodyRenderData,
  type CelestialBodyState,
} from './celestialBodyTypes'

interface CelestialBodyVisualRule {
  minMagnitude: number
  maxMagnitude: number
  minBrightness: number
  maxBrightness: number
  minSizeScale: number
  maxSizeScale: number
}

const HORIZON_FADE_END_ALTITUDE_DEGREES = 18
const HORIZON_MIN_BRIGHTNESS_MULTIPLIER = 0.58
const HORIZON_MIN_SIZE_MULTIPLIER = 0.82

const CELESTIAL_BODY_VISUAL_RULES: Readonly<{
  moon: CelestialBodyVisualRule
  planet: CelestialBodyVisualRule
}> = {
  moon: {
    minMagnitude: -13,
    maxMagnitude: -2,
    minBrightness: 0.62,
    maxBrightness: 0.88,
    minSizeScale: 2,
    maxSizeScale: 2.85,
  },
  planet: {
    minMagnitude: -5,
    maxMagnitude: 2.5,
    minBrightness: 0.32,
    maxBrightness: 0.78,
    minSizeScale: 0.92,
    maxSizeScale: 1.42,
  },
}

function magnitudeToNormalizedVisibility(
  magnitude: number | null,
  rule: CelestialBodyVisualRule,
): number {
  if (magnitude === null) return 0.5

  const normalized =
    (rule.maxMagnitude - magnitude) /
    (rule.maxMagnitude - rule.minMagnitude)

  return clamp(normalized, 0, 1)
}

function resolveVisualRule(state: CelestialBodyState): CelestialBodyVisualRule {
  return state.kind === 'moon'
    ? CELESTIAL_BODY_VISUAL_RULES.moon
    : CELESTIAL_BODY_VISUAL_RULES.planet
}

function calculateHorizonFade(altitudeDegrees: number): {
  brightnessMultiplier: number
  sizeMultiplier: number
} {
  const normalized = clamp(
    altitudeDegrees / HORIZON_FADE_END_ALTITUDE_DEGREES,
    0,
    1,
  )

  return {
    brightnessMultiplier:
      HORIZON_MIN_BRIGHTNESS_MULTIPLIER +
      normalized * (1 - HORIZON_MIN_BRIGHTNESS_MULTIPLIER),
    sizeMultiplier:
      HORIZON_MIN_SIZE_MULTIPLIER +
      normalized * (1 - HORIZON_MIN_SIZE_MULTIPLIER),
  }
}

export function createCelestialBodyRenderData(
  state: CelestialBodyState,
): CelestialBodyRenderData | null {
  if (state.horizontal.altitudeDegrees < 0) return null

  const rule = resolveVisualRule(state)
  const normalized = magnitudeToNormalizedVisibility(
    state.apparentMagnitude,
    rule,
  )
  const definition = findCelestialBodyDefinition(state.id)
  const { min, max } = starfieldConfig.brightness
  const horizonFade = calculateHorizonFade(state.horizontal.altitudeDegrees)
  const baseBrightness =
    rule.minBrightness + normalized * (rule.maxBrightness - rule.minBrightness)
  const baseSizeScale =
    rule.minSizeScale + normalized * (rule.maxSizeScale - rule.minSizeScale)

  return {
    id: state.id,
    kind: state.kind,
    position: projectHorizontalToSphere(state.horizontal),
    visualClass: definition.visualClass,
    brightness: clamp(
      baseBrightness * horizonFade.brightnessMultiplier,
      min,
      max,
    ),
    sizeScale: baseSizeScale * horizonFade.sizeMultiplier,
  }
}

export function createCelestialBodyRenderDataList(
  states: readonly CelestialBodyState[],
): CelestialBodyRenderData[] {
  return states.flatMap((state) => {
    const renderData = createCelestialBodyRenderData(state)
    return renderData === null ? [] : [renderData]
  })
}
