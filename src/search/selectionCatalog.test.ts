import { describe, expect, it } from 'vitest'
import { buildSelectionOptions } from './selectionCatalog'

describe('buildSelectionOptions', () => {
  const options = buildSelectionOptions()

  it('includes the phase-7 celestial bodies first', () => {
    expect(options.slice(0, 6).map((option) => option.type)).toEqual([
      'celestialBody',
      'celestialBody',
      'celestialBody',
      'celestialBody',
      'celestialBody',
      'celestialBody',
    ])
    expect(options[0]?.label).toBe('Moon (月)')
  })

  it('includes constellations and named stars for direct selection', () => {
    expect(
      options.some(
        (option) =>
          option.type === 'constellation' &&
          option.label === 'Orion (オリオン座)',
      ),
    ).toBe(true)
    expect(
      options.some(
        (option) => option.type === 'star' && option.label.includes('Altair'),
      ),
    ).toBe(true)
  })
})
