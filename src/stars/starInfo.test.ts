import { describe, expect, it } from 'vitest'
import type { ConstellationRecord } from '../constellations/constellationTypes'
import {
  buildSelectedConstellationInfo,
  buildSelectedStarInfo,
  describeBrightness,
  describeColor,
} from './starInfo'
import type { HygStarRecord } from './starTypes'

describe('describeBrightness', () => {
  it('labels bright stars distinctly from dim ones', () => {
    expect(describeBrightness(-1.46)).toBe('とても明るい') // Sirius
    expect(describeBrightness(0.03)).toBe('明るい') // Vega
    expect(describeBrightness(6.4)).toBe('暗め')
  })
})

describe('describeColor', () => {
  it('maps each documented color category to a label', () => {
    expect(describeColor('white')).toBe('白')
    expect(describeColor('blueWhite')).toBe('青白い')
    expect(describeColor('paleOrange')).toBe('オレンジがかった')
  })
})

const BASE_STAR: HygStarRecord = {
  id: 1,
  raHours: 0,
  decDegrees: 0,
  magnitude: 1,
  colorIndex: 0,
  properName: null,
}

const CONSTELLATION: ConstellationRecord = {
  id: 'Aql',
  name: 'Aquila',
  nameJa: 'わし座',
  segments: [[1, 2]],
}

describe('buildSelectedStarInfo', () => {
  it('uses the display name (with Japanese katakana when curated) for a named star', () => {
    const info = buildSelectedStarInfo(
      { ...BASE_STAR, properName: 'Altair' },
      null,
    )
    expect(info.displayName).toBe('Altair (アルタイル)')
  })

  it('falls back to a generic label for a star with no proper name', () => {
    const info = buildSelectedStarInfo(BASE_STAR, null)
    expect(info.displayName).toBe('名前のない星')
  })

  it('includes the constellation label only when one is given', () => {
    expect(buildSelectedStarInfo(BASE_STAR, null).constellationLabel).toBeNull()
    expect(
      buildSelectedStarInfo(BASE_STAR, CONSTELLATION).constellationLabel,
    ).toBe('Aquila (わし座)')
  })

  it("prefers the star's own trivia over its constellation's", () => {
    const info = buildSelectedStarInfo(
      { ...BASE_STAR, properName: 'Altair' },
      CONSTELLATION,
    )
    expect(info.trivia).toMatch(/わし座/)
    expect(info.trivia).not.toMatch(/ゼウスの使い/) // constellation's own trivia text
  })

  it("falls back to the constellation's trivia when the star has none curated", () => {
    const info = buildSelectedStarInfo(BASE_STAR, CONSTELLATION)
    expect(info.trivia).toMatch(/ゼウスの使い/)
  })

  it('has no trivia for an unnamed, constellation-less star', () => {
    expect(buildSelectedStarInfo(BASE_STAR, null).trivia).toBeNull()
  })
})

describe('buildSelectedConstellationInfo', () => {
  it('builds a name + trivia only, with no star-specific fields', () => {
    const info = buildSelectedConstellationInfo(CONSTELLATION)
    expect(info.displayName).toBe('Aquila (わし座)')
    expect(info.brightnessLabel).toBeNull()
    expect(info.colorLabel).toBeNull()
    expect(info.trivia).toMatch(/ゼウスの使い/)
  })
})
