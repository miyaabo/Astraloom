import { describe, expect, it } from 'vitest'
import {
  createCelestialBodySearchRecords,
  findCelestialBodyDefinition,
  loadCelestialBodyDefinitions,
  supportedCelestialBodyIds,
} from './celestialBodyTypes'

describe('celestialBodyTypes', () => {
  it('defines the phase-7 supported visible bodies in a stable order', () => {
    expect(supportedCelestialBodyIds).toEqual([
      'moon',
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
    ])

    expect(loadCelestialBodyDefinitions().map((body) => body.id)).toEqual(
      supportedCelestialBodyIds,
    )
  })

  it('keeps astronomy, render, and search concerns separate in the static definitions', () => {
    const moon = findCelestialBodyDefinition('moon')
    const venus = findCelestialBodyDefinition('venus')

    expect(moon).toMatchObject({
      id: 'moon',
      kind: 'moon',
      displayName: 'Moon',
      displayNameJa: '月',
      visualClass: 'moon',
    })
    expect(venus).toMatchObject({
      id: 'venus',
      kind: 'planet',
      displayName: 'Venus',
      displayNameJa: '金星',
      visualClass: 'warm',
    })
  })

  it('builds search records from static metadata without runtime sky state', () => {
    const records = createCelestialBodySearchRecords()
    const mars = records.find((record) => record.id === 'mars')

    expect(mars).toEqual({
      id: 'mars',
      kind: 'planet',
      displayName: 'Mars',
      displayNameJa: '火星',
      searchText: 'mars 火星 mars 火星 かせい',
    })
  })
})
