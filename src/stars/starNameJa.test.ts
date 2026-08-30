import { describe, expect, it } from 'vitest'
import { toDisplayStarName } from './starNameJa'

describe('toDisplayStarName', () => {
  it('pairs the English proper name with its curated katakana name', () => {
    expect(toDisplayStarName('Sirius')).toBe('Sirius (シリウス)')
    expect(toDisplayStarName('Altair')).toBe('Altair (アルタイル)')
  })

  it('falls back to just the English proper name when uncurated', () => {
    expect(toDisplayStarName('Not A Real Curated Name')).toBe(
      'Not A Real Curated Name',
    )
  })
})
