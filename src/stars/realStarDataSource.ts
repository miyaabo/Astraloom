import {
  equatorialToHorizontalAtHourAngle,
  localSiderealTimeDegrees,
} from '../astronomy/coordinates'
import type { ObserverLocation } from '../astronomy/coordinates'
import { loadHygStarCatalog } from './hygCatalogSource'
import { clamp } from '../mathUtils'
import { projectHorizontalToSphere } from './skyProjection'
import { starfieldConfig } from './starfieldConfig'
import {
  deriveSizeVariance,
  deriveTwinkleAmplitude,
  deriveTwinklePhase,
} from './starVisualAttributes'
import type { StarColorCategory, StarData } from './starTypes'

// B-V color index boundaries for hot (blue-white) and cool (orange) stars,
// chosen so the bundled HYG catalog reproduces the Visual Target's
// white-majority look (~80% white / 12% blueWhite / 8% paleOrange, matching
// the ratios the pre-real-data star generator enforced) rather than the raw
// astronomical distribution, which skews cooler than "mostly white".
const BLUE_WHITE_MAX_COLOR_INDEX = -0.07
const PALE_ORANGE_MIN_COLOR_INDEX = 1.5

// Brightness normalization range: slightly brighter than Sirius (-1.46, the
// brightest star in the catalog) for headroom, down to the catalog's
// magnitude cutoff (D013 / scripts/build-hyg-catalog.mjs).
const BRIGHTEST_EXPECTED_MAGNITUDE = -1.5
const DIMMEST_CATALOG_MAGNITUDE = 6.5

function magnitudeToBrightness(magnitude: number): number {
  const { min, max } = starfieldConfig.brightness
  const normalized =
    (DIMMEST_CATALOG_MAGNITUDE - magnitude) /
    (DIMMEST_CATALOG_MAGNITUDE - BRIGHTEST_EXPECTED_MAGNITUDE)
  return min + clamp(normalized, 0, 1) * (max - min)
}

/** Exported for reuse by starInfo.ts (Task 5), so a selected star's info-panel color word always agrees with its rendered color. */
export function colorIndexToCategory(
  colorIndex: number | null,
): StarColorCategory {
  if (colorIndex === null) return 'white'
  if (colorIndex < BLUE_WHITE_MAX_COLOR_INDEX) return 'blueWhite'
  if (colorIndex > PALE_ORANGE_MIN_COLOR_INDEX) return 'paleOrange'
  return 'white'
}

/**
 * Builds StarData from the real HYG catalog (Task 2 / D013), positioned for
 * a given observer location and instant via astronomical alt/az conversion
 * (Task 3 / src/astronomy/coordinates.ts) and the sky-sphere projection
 * (skyProjection.ts). Stars below the horizon are dropped.
 *
 * Twinkle phase and size variance are derived deterministically from the
 * catalog's stable star id (not Math.random()), so a star's twinkle/size
 * stays fixed across date/location recomputes instead of jumping every time
 * Task 5/6's overlays trigger a regenerate.
 */
export function generateRealStarData(
  location: ObserverLocation,
  date: Date,
): StarData[] {
  const catalog = loadHygStarCatalog()
  const stars: StarData[] = []

  // Sidereal time depends only on (date, location), not on any individual
  // star, so it's computed once here rather than once per catalog record
  // (equatorialToHorizontalAtHourAngle does the per-star trig with it).
  const lstDegrees = localSiderealTimeDegrees(date, location.longitudeDegrees)

  let nextId = 0
  for (const record of catalog) {
    const hourAngleDegrees = lstDegrees - record.raHours * 15
    const horizontal = equatorialToHorizontalAtHourAngle(
      record.decDegrees,
      hourAngleDegrees,
      location.latitudeDegrees,
    )
    if (horizontal.altitudeDegrees < 0) continue

    const brightness = magnitudeToBrightness(record.magnitude)

    stars.push({
      id: nextId++,
      hygId: record.id,
      position: projectHorizontalToSphere(horizontal),
      brightness,
      colorCategory: colorIndexToCategory(record.colorIndex),
      twinklePhase: deriveTwinklePhase(record.id),
      twinkleAmplitude: deriveTwinkleAmplitude(brightness),
      sizeVariance: deriveSizeVariance(record.id),
    })
  }

  return stars
}
