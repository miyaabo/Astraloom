import type { SelectedStarInfo } from '../stars/starInfo'
import { findCelestialBodyDefinition, type CelestialBodyState } from './celestialBodyTypes'

const VISUAL_CLASS_LABEL = {
  moon: '白っぽい',
  neutral: 'やわらかな白',
  warm: '少し暖かい',
  cool: '少し青みがある',
} as const

function describeCelestialBodyKind(state: CelestialBodyState): string {
  return state.kind === 'moon' ? '月' : '惑星'
}

function describeCelestialBodyColor(
  state: CelestialBodyState,
): string {
  return VISUAL_CLASS_LABEL[findCelestialBodyDefinition(state.id).visualClass]
}

function describeIllumination(
  illuminatedFraction: number | null,
): string | null {
  if (illuminatedFraction === null) return null
  if (illuminatedFraction >= 0.9) return 'ほぼ満ちている'
  if (illuminatedFraction >= 0.6) return 'よく見えている'
  if (illuminatedFraction >= 0.3) return '半分前後'
  return '細めに見える'
}

function describeVisibility(altitudeDegrees: number): string | null {
  if (altitudeDegrees < 0) return '現在は地平線の下にいる'
  if (altitudeDegrees < 5) return '地平線近くに見える'
  return null
}

export function buildSelectedCelestialBodyInfo(
  state: CelestialBodyState,
): SelectedStarInfo {
  const definition = findCelestialBodyDefinition(state.id)
  const illuminationLabel = describeIllumination(state.illuminatedFraction)
  const visibilityLabel = describeVisibility(state.horizontal.altitudeDegrees)
  const detailLabel =
    visibilityLabel && illuminationLabel
      ? `${visibilityLabel} / ${illuminationLabel}`
      : visibilityLabel ?? illuminationLabel

  return {
    displayName: `${definition.displayName} (${definition.displayNameJa})`,
    categoryLabel: describeCelestialBodyKind(state),
    brightnessLabel:
      state.apparentMagnitude === null ? null : '目立つ',
    colorLabel: describeCelestialBodyColor(state),
    constellationLabel: null,
    detailLabel,
    trivia: null,
  }
}
