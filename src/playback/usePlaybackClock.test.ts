import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaybackClock } from './usePlaybackClock'

// Deterministic stand-in for the browser's rAF loop: requestAnimationFrame
// just queues the callback, and flushFrame() below invokes queued callbacks
// on demand with a controlled timestamp.
let queued: Map<number, FrameRequestCallback>
let nextId: number

function flushFrame(nowMs: number): void {
  const callbacks = [...queued.values()]
  queued.clear()
  callbacks.forEach((callback) => callback(nowMs))
}

beforeEach(() => {
  queued = new Map()
  nextId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextId
    queued.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queued.delete(id)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePlaybackClock', () => {
  it('does not tick while isPlaying is false', () => {
    const onTick = vi.fn()
    renderHook(() => usePlaybackClock(false, onTick))

    expect(queued.size).toBe(0)
    expect(onTick).not.toHaveBeenCalled()
  })

  it('reports elapsed real time between frames while playing', () => {
    const onTick = vi.fn()
    renderHook(() => usePlaybackClock(true, onTick))

    // First frame only establishes the baseline timestamp; no prior frame to diff against.
    flushFrame(1000)
    expect(onTick).not.toHaveBeenCalled()

    flushFrame(1250)
    expect(onTick).toHaveBeenCalledWith(250)

    flushFrame(1900)
    expect(onTick).toHaveBeenCalledWith(650)
  })

  it('stops requesting frames once isPlaying becomes false', () => {
    const onTick = vi.fn()
    const { rerender } = renderHook(
      ({ isPlaying }) => usePlaybackClock(isPlaying, onTick),
      { initialProps: { isPlaying: true } },
    )

    flushFrame(1000)
    rerender({ isPlaying: false })

    expect(queued.size).toBe(0)
    onTick.mockClear()
    flushFrame(2000)
    expect(onTick).not.toHaveBeenCalled()
  })
})
