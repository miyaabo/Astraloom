import { describe, expect, it } from 'vitest'
import {
  accumulatePlaybackTick,
  advancePlaybackDate,
  PLAYBACK_RECOMPUTE_INTERVAL_MS,
} from './playbackTime'

describe('advancePlaybackDate', () => {
  const base = new Date('2026-01-01T00:00:00.000Z')

  it('advances forward by speedMagnitude times the elapsed real time', () => {
    const next = advancePlaybackDate(base, 1000, 60, 1)
    expect(next.getTime() - base.getTime()).toBe(60_000)
  })

  it('advances backward when direction is -1', () => {
    const next = advancePlaybackDate(base, 1000, 60, -1)
    expect(next.getTime() - base.getTime()).toBe(-60_000)
  })

  it('scales with speedMagnitude', () => {
    const slow = advancePlaybackDate(base, 1000, 1, 1)
    const fast = advancePlaybackDate(base, 1000, 3600, 1)
    expect(fast.getTime() - base.getTime()).toBe(
      (slow.getTime() - base.getTime()) * 3600,
    )
  })

  it('does not change the date when no real time has elapsed', () => {
    const next = advancePlaybackDate(base, 0, 3600, 1)
    expect(next.getTime()).toBe(base.getTime())
  })
})

describe('accumulatePlaybackTick', () => {
  it('withholds a recompute while accumulated time is under the interval', () => {
    const result = accumulatePlaybackTick(0, PLAYBACK_RECOMPUTE_INTERVAL_MS / 2)
    expect(result.elapsedRealMs).toBeNull()
    expect(result.nextPendingRealMs).toBe(PLAYBACK_RECOMPUTE_INTERVAL_MS / 2)
  })

  it('triggers a recompute once accumulated time reaches the interval, resetting the accumulator', () => {
    const result = accumulatePlaybackTick(0, PLAYBACK_RECOMPUTE_INTERVAL_MS)
    expect(result.elapsedRealMs).toBe(PLAYBACK_RECOMPUTE_INTERVAL_MS)
    expect(result.nextPendingRealMs).toBe(0)
  })

  it('carries pending time across ticks until it crosses the interval', () => {
    const first = accumulatePlaybackTick(0, PLAYBACK_RECOMPUTE_INTERVAL_MS - 1)
    expect(first.elapsedRealMs).toBeNull()

    const second = accumulatePlaybackTick(first.nextPendingRealMs, 2)
    expect(second.elapsedRealMs).toBe(PLAYBACK_RECOMPUTE_INTERVAL_MS + 1)
    expect(second.nextPendingRealMs).toBe(0)
  })

  it('reports the full accumulated elapsed time, not just the interval, so no simulated time is lost', () => {
    const result = accumulatePlaybackTick(0, PLAYBACK_RECOMPUTE_INTERVAL_MS * 3)
    expect(result.elapsedRealMs).toBe(PLAYBACK_RECOMPUTE_INTERVAL_MS * 3)
  })
})
