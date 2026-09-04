import { describe, expect, it } from 'vitest'
import { loadHygStarCatalog } from '../stars/hygCatalogSource'
import {
  LEO_ART_PROTOTYPE,
  resolveLeoArtPrototypeAnchors,
} from './leoArtPrototype'

// Real HYG catalog, real data — this is a check that the hand-picked star
// ids actually are the Leo stars the comments in leoArtPrototype.ts claim,
// not synthetic fixtures. 49441 (Eta Leonis) has no properName in this
// catalog, so it's checked by id/position only, not by name.
const EXPECTED_NAMES_BY_STAR_ID: Record<number, string | null> = {
  50440: 'Algieba',
  47772: 'Ras Elased Australis',
  54712: 'Zosma',
  49441: null,
  54718: 'Chertan',
  57459: 'Denebola',
  49528: 'Regulus',
}

describe('LEO_ART_PROTOTYPE', () => {
  it('every anchor references the real Leo star its comment claims', () => {
    const starsById = new Map(
      loadHygStarCatalog().map((star) => [star.id, star]),
    )
    for (const anchor of LEO_ART_PROTOTYPE.anchors) {
      const star = starsById.get(anchor.starId)
      expect(star).toBeDefined()
      expect(star?.properName).toBe(EXPECTED_NAMES_BY_STAR_ID[anchor.starId])
    }
  })

  it('has 7 anchors, all within the image bounds', () => {
    expect(LEO_ART_PROTOTYPE.anchors).toHaveLength(7)
    for (const anchor of LEO_ART_PROTOTYPE.anchors) {
      expect(anchor.pixelX).toBeGreaterThanOrEqual(0)
      expect(anchor.pixelX).toBeLessThanOrEqual(LEO_ART_PROTOTYPE.imageWidthPx)
      expect(anchor.pixelY).toBeGreaterThanOrEqual(0)
      expect(anchor.pixelY).toBeLessThanOrEqual(LEO_ART_PROTOTYPE.imageHeightPx)
    }
  })
})

describe('resolveLeoArtPrototypeAnchors', () => {
  it('resolves all 7 anchors above the horizon when Leo is well placed', () => {
    // 2027-04-10 21:00 JST, Tokyo — verified earlier (Starfield.test.tsx-
    // adjacent exploration) to put Leo near zenith.
    const location = { latitudeDegrees: 35.6762, longitudeDegrees: 139.6503 }
    const date = new Date('2027-04-10T12:00:00Z')

    const anchors = resolveLeoArtPrototypeAnchors(location, date)
    expect(anchors).toHaveLength(7)
    for (const anchor of anchors) {
      const radius = Math.hypot(
        anchor.position.x,
        anchor.position.y,
        anchor.position.z,
      )
      expect(radius).toBeGreaterThan(0)
    }
  })

  it('resolves no anchors when Leo is below the horizon', () => {
    // 2026-09-03 21:00 JST, Tokyo — verified earlier to put Leo well below
    // the horizon.
    const location = { latitudeDegrees: 35.6762, longitudeDegrees: 139.6503 }
    const date = new Date('2026-09-03T12:00:00Z')

    expect(resolveLeoArtPrototypeAnchors(location, date)).toEqual([])
  })
})
