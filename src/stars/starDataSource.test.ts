import { describe, expect, it } from 'vitest'
import { generateStarData } from './starDataSource'
import { starfieldConfig } from './starfieldConfig'

describe('generateStarData', () => {
  it('generates the requested number of stars with unique sequential ids', () => {
    const stars = generateStarData(500)
    expect(stars).toHaveLength(500)
    stars.forEach((star, index) => expect(star.id).toBe(index))
  })

  it('defaults to the configured star count', () => {
    const stars = generateStarData()
    expect(stars).toHaveLength(starfieldConfig.starCount)
  })

  it('keeps every value within its documented range', () => {
    const stars = generateStarData(2000)

    for (const star of stars) {
      expect(star.position.x).toBeGreaterThanOrEqual(-1)
      expect(star.position.x).toBeLessThanOrEqual(1)
      expect(star.position.y).toBeGreaterThanOrEqual(-1)
      expect(star.position.y).toBeLessThanOrEqual(1)

      expect(star.brightness).toBeGreaterThanOrEqual(
        starfieldConfig.brightness.min,
      )
      expect(star.brightness).toBeLessThanOrEqual(
        starfieldConfig.brightness.max,
      )

      expect(['white', 'blueWhite', 'paleOrange']).toContain(star.colorCategory)

      expect(star.twinklePhase).toBeGreaterThanOrEqual(0)
      expect(star.twinklePhase).toBeLessThanOrEqual(Math.PI * 2)

      expect(star.twinkleAmplitude).toBeGreaterThanOrEqual(
        starfieldConfig.twinkle.minAmplitude,
      )
      expect(star.twinkleAmplitude).toBeLessThanOrEqual(
        starfieldConfig.twinkle.maxAmplitude,
      )

      expect(star.sizeVariance).toBeGreaterThanOrEqual(
        starfieldConfig.sizeVariance.min,
      )
      expect(star.sizeVariance).toBeLessThanOrEqual(
        starfieldConfig.sizeVariance.max,
      )
    }
  })

  it('skews brightness toward dim stars so bright stars stay a minority', () => {
    const stars = generateStarData(5000)
    const averageBrightness =
      stars.reduce((sum, star) => sum + star.brightness, 0) / stars.length
    const brightShare =
      stars.filter((star) => star.brightness > 0.7).length / stars.length

    expect(averageBrightness).toBeLessThan(0.45)
    expect(brightShare).toBeLessThan(0.25)
  })

  it('keeps color categories close to their configured weights', () => {
    const stars = generateStarData(8000)
    const whiteShare =
      stars.filter((star) => star.colorCategory === 'white').length /
      stars.length

    expect(whiteShare).toBeGreaterThan(0.7)
  })

  it('gives brighter stars a larger average twinkle amplitude than dim stars', () => {
    const stars = generateStarData(5000)
    const dim = stars.filter((star) => star.brightness < 0.2)
    const bright = stars.filter((star) => star.brightness > 0.7)

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length

    expect(
      average(bright.map((star) => star.twinkleAmplitude)),
    ).toBeGreaterThan(average(dim.map((star) => star.twinkleAmplitude)))
  })
})
