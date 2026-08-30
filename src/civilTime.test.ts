import { describe, expect, it } from 'vitest'
import { utcToZonedWallClock, zonedWallClockToUtc } from './civilTime'

describe('zonedWallClockToUtc', () => {
  it('converts a Tokyo (fixed UTC+9, no DST) wall clock to the correct instant', () => {
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 8, day: 29, hour: 21, minute: 0 },
      'Asia/Tokyo',
    )
    expect(utc.toISOString()).toBe('2026-08-29T12:00:00.000Z')
  })

  it('accounts for New York summer DST (UTC-4)', () => {
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 7, day: 15, hour: 9, minute: 0 },
      'America/New_York',
    )
    expect(utc.toISOString()).toBe('2026-07-15T13:00:00.000Z')
  })

  it('accounts for New York winter standard time (UTC-5), the same wall-clock hour as the DST case', () => {
    const utc = zonedWallClockToUtc(
      { year: 2026, month: 1, day: 15, hour: 9, minute: 0 },
      'America/New_York',
    )
    expect(utc.toISOString()).toBe('2026-01-15T14:00:00.000Z')
  })

  it('produces different instants for the same wall-clock value in different time zones', () => {
    const wallClock = { year: 2026, month: 8, day: 29, hour: 22, minute: 0 }
    const tokyo = zonedWallClockToUtc(wallClock, 'Asia/Tokyo')
    const newYork = zonedWallClockToUtc(wallClock, 'America/New_York')
    expect(tokyo.getTime()).not.toBe(newYork.getTime())
  })
})

describe('utcToZonedWallClock', () => {
  it('formats an instant as Sydney local time (UTC+11 in the southern-hemisphere summer)', () => {
    const parts = utcToZonedWallClock(
      new Date('2026-01-15T00:00:00.000Z'),
      'Australia/Sydney',
    )
    expect(parts).toEqual({
      year: 2026,
      month: 1,
      day: 15,
      hour: 11,
      minute: 0,
    })
  })

  it('round-trips through zonedWallClockToUtc for an arbitrary zone', () => {
    const original = { year: 2026, month: 3, day: 10, hour: 14, minute: 30 }
    const utc = zonedWallClockToUtc(original, 'Europe/London')
    const roundTripped = utcToZonedWallClock(utc, 'Europe/London')
    expect(roundTripped).toEqual(original)
  })
})
