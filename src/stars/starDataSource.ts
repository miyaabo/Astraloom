import { starfieldConfig } from './starfieldConfig'
import type { StarColorCategory, StarData } from './starTypes'

function pickColorCategory(): StarColorCategory {
  const { white, blueWhite } = starfieldConfig.colorCategoryWeights
  const roll = Math.random()
  if (roll < white) return 'white'
  if (roll < white + blueWhite) return 'blueWhite'
  return 'paleOrange'
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Generates placeholder star data (position, brightness, color, twinkle, size).
 * Position is placed independently of visual tuning (starfieldConfig) so future
 * placement strategies (e.g. sphere projection) can swap in without touching
 * how brightness/color/twinkle/size are derived.
 */
export function generateStarData(
  count: number = starfieldConfig.starCount,
): StarData[] {
  const stars: StarData[] = []

  for (let id = 0; id < count; id++) {
    const brightness =
      starfieldConfig.brightness.min +
      Math.pow(Math.random(), starfieldConfig.brightness.curvePower) *
        (starfieldConfig.brightness.max - starfieldConfig.brightness.min)

    const twinkleAmplitude =
      starfieldConfig.twinkle.minAmplitude +
      Math.pow(brightness, starfieldConfig.twinkle.amplitudeBrightnessPower) *
        (starfieldConfig.twinkle.maxAmplitude -
          starfieldConfig.twinkle.minAmplitude)

    stars.push({
      id,
      position: {
        x: randomBetween(-1, 1),
        y: randomBetween(-1, 1),
      },
      brightness,
      colorCategory: pickColorCategory(),
      twinklePhase: randomBetween(0, Math.PI * 2),
      twinkleAmplitude,
      sizeVariance: randomBetween(
        starfieldConfig.sizeVariance.min,
        starfieldConfig.sizeVariance.max,
      ),
    })
  }

  return stars
}
