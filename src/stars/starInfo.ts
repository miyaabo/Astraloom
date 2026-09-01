import { findConstellationTrivia } from '../constellations/constellationTrivia'
import type { ConstellationRecord } from '../constellations/constellationTypes'
import { colorIndexToCategory } from './realStarDataSource'
import { toDisplayStarName } from './starNameJa'
import type { HygStarRecord, StarColorCategory } from './starTypes'
import { findStarTrivia } from './starTrivia'

/**
 * Selected-star info shown in the Task 5 info panel: "軽い基本情報(明るさ・色・
 * 所属星座など)" from phase-3-star-knowledge.md, not the star's raw
 * astronomical values — Product Principle 2 (Relaxation Over Information
 * Density) calls for a calm/casual read, not an observation app's numeric
 * readout. Also reused (Task 7) for a constellation-only selection (search /
 * "next constellation" — see buildSelectedConstellationInfo below), where
 * brightness/color don't apply to a whole constellation and are null.
 */
export interface SelectedStarInfo {
  displayName: string
  /** Optional object category, e.g. star / constellation / planet / moon. */
  categoryLabel?: string | null
  /** Null for a constellation-only selection (buildSelectedConstellationInfo). */
  brightnessLabel: string | null
  /** Null for a constellation-only selection (buildSelectedConstellationInfo). */
  colorLabel: string | null
  /** "英名 (和名)" of the constellation this star belongs to, or null if it isn't part of any constellation's line figure. */
  constellationLabel: string | null
  /** Optional calm extra detail such as illumination state for celestial bodies. */
  detailLabel?: string | null
  /** Short trivia text (Task 7), or null when nothing is curated for this star/constellation. */
  trivia: string | null
}

// Rough naked-eye brightness classes by apparent magnitude (lower = brighter).
// Boundaries chosen so 1st-magnitude-class stars (Vega, Altair, ...) read as
// "明るい" and the catalog's mag<=6.5 cutoff (D013) reads as "暗め", without
// exposing the (inverted, easy-to-misread) magnitude number itself.
const VERY_BRIGHT_MAX_MAGNITUDE = 0
const BRIGHT_MAX_MAGNITUDE = 1.5
const MEDIUM_MAX_MAGNITUDE = 3.5
const DIM_MAX_MAGNITUDE = 5

export function describeBrightness(magnitude: number): string {
  if (magnitude <= VERY_BRIGHT_MAX_MAGNITUDE) return 'とても明るい'
  if (magnitude <= BRIGHT_MAX_MAGNITUDE) return '明るい'
  if (magnitude <= MEDIUM_MAX_MAGNITUDE) return 'やや明るい'
  if (magnitude <= DIM_MAX_MAGNITUDE) return '普通'
  return '暗め'
}

const COLOR_LABEL: Readonly<Record<StarColorCategory, string>> = {
  white: '白',
  blueWhite: '青白い',
  paleOrange: 'オレンジがかった',
}

export function describeColor(colorCategory: StarColorCategory): string {
  return COLOR_LABEL[colorCategory]
}

// A tapped star's own trivia (if curated) takes priority over its
// constellation's, since the star is what was actually selected; falls back
// to the constellation's trivia so a selection still surfaces something for
// the ~330 named stars without a curated entry in starTrivia.ts.
function findTriviaForStar(
  star: HygStarRecord,
  constellation: ConstellationRecord | null,
): string | null {
  const starTrivia = star.properName ? findStarTrivia(star.properName) : null
  if (starTrivia) return starTrivia
  return constellation ? findConstellationTrivia(constellation.name) : null
}

/**
 * Builds the Task 5 info panel's content for a tap/click-selected star, from
 * its HYG catalog record and (if any) the constellation it belongs to.
 */
export function buildSelectedStarInfo(
  star: HygStarRecord,
  constellation: ConstellationRecord | null,
): SelectedStarInfo {
  return {
    displayName: star.properName
      ? toDisplayStarName(star.properName)
      : '名前のない星',
    categoryLabel: '恒星',
    brightnessLabel: describeBrightness(star.magnitude),
    colorLabel: describeColor(colorIndexToCategory(star.colorIndex)),
    constellationLabel: constellation
      ? `${constellation.name} (${constellation.nameJa})`
      : null,
    detailLabel: null,
    trivia: findTriviaForStar(star, constellation),
  }
}

/**
 * Builds the same panel's content for a constellation-only selection (Task
 * 6's search / "next constellation" flows — no specific star tapped).
 * Brightness/color don't apply to a constellation as a whole, so those
 * fields are null; StarInfoOverlay skips that line when they are.
 */
export function buildSelectedConstellationInfo(
  constellation: ConstellationRecord,
): SelectedStarInfo {
  return {
    displayName: `${constellation.name} (${constellation.nameJa})`,
    categoryLabel: '星座',
    brightnessLabel: null,
    colorLabel: null,
    constellationLabel: null,
    detailLabel: null,
    trivia: findConstellationTrivia(constellation.name),
  }
}
