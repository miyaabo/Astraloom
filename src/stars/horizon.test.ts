import { describe, expect, it } from 'vitest'
import { generateHorizonMeshData } from './horizon'
import { SKY_SPHERE_RADIUS } from './skyProjection'

describe('generateHorizonMeshData', () => {
  const azimuthSegments = 8
  const altitudeSegments = 4
  const glowSpanDegrees = 10
  const { positions, depths, indices } = generateHorizonMeshData(
    azimuthSegments,
    altitudeSegments,
    glowSpanDegrees,
  )

  const vertexCount = (azimuthSegments + 1) * (altitudeSegments + 1)

  it('produces one position triple and one depth value per vertex', () => {
    expect(positions).toHaveLength(vertexCount * 3)
    expect(depths).toHaveLength(vertexCount)
  })

  it('places every vertex on the sky sphere', () => {
    for (let i = 0; i < vertexCount; i++) {
      const distance = Math.hypot(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2],
      )
      // Positions are stored in a Float32Array (unlike milkyWay.ts's plain
      // JS-number positions), so precision is limited to ~7 significant digits.
      expect(distance).toBeCloseTo(SKY_SPHERE_RADIUS, 3)
    }
  })

  it('ranges depth from 1 at the bottom (nadir) to negative at the top (above the horizon)', () => {
    expect(Math.max(...depths)).toBeCloseTo(1, 6)
    expect(Math.min(...depths)).toBeCloseTo(-glowSpanDegrees / 90, 6)
  })

  it('spans both below-horizon (positive) and above-horizon (negative) depths', () => {
    expect(depths.some((depth) => depth > 0)).toBe(true)
    expect(depths.some((depth) => depth < 0)).toBe(true)
  })

  it('only indexes vertices that exist in the position/depth buffers', () => {
    expect(indices).toHaveLength(altitudeSegments * azimuthSegments * 6)
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(vertexCount)
    }
  })
})
