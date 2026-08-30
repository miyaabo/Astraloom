import { describe, expect, it } from 'vitest'
import { findStarTrivia } from './starTrivia'

describe('findStarTrivia', () => {
  it('returns curated trivia for well-known named stars', () => {
    expect(findStarTrivia('Sirius')).toMatch(/おおいぬ座/)
    expect(findStarTrivia('Altair')).toMatch(/わし座/)
    expect(findStarTrivia('Polaris')).toMatch(/北極星/)
  })

  it('returns null for an uncurated star name', () => {
    expect(findStarTrivia('Not A Real Curated Name')).toBeNull()
  })
})
