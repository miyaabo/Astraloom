import { describe, expect, it } from 'vitest'
import { normalizeBearing } from './compassBearing'

describe('normalizeBearing', () => {
  it('wraps into (-180, 180]', () => {
    expect(normalizeBearing(0)).toBe(0)
    expect(normalizeBearing(180)).toBe(180)
    expect(normalizeBearing(-180)).toBe(180)
    expect(normalizeBearing(181)).toBeCloseTo(-179, 9)
    expect(normalizeBearing(-181)).toBeCloseTo(179, 9)
    expect(normalizeBearing(360)).toBe(0)
  })

  it('stays continuous around the compass-strip boundary at heading 0 facing a target at 180deg', () => {
    // Regression test: the wrap used to snap from +180 to -180 exactly at
    // this boundary, teleporting a marker across the whole strip for an
    // infinitesimal heading change (see docs/features/phase-2-implementation-tasks.md Task 7).
    const justBefore = normalizeBearing(180 - 0.5)
    const atBoundary = normalizeBearing(180)
    const justAfter = normalizeBearing(180 + 0.5)

    expect(atBoundary).toBe(180)
    expect(Math.abs(atBoundary - justBefore)).toBeLessThan(1)
    // justAfter wraps to the other side of the circle but represents a
    // physically adjacent bearing (180.5 == -179.5 mod 360).
    expect(justAfter).toBeCloseTo(-179.5, 9)
  })
})
