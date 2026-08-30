import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Starfield } from './Starfield'

// jsdom has no WebGL context, so the real Three.js renderer can't run here;
// browser rendering is covered by the Task 8 Playwright smoke test instead.
const updateStars = vi.fn()
vi.mock('./render/StarfieldRenderer', () => ({
  StarfieldRenderer: class {
    resize = vi.fn()
    render = vi.fn()
    start = vi.fn()
    dispose = vi.fn()
    updateStars = updateStars
  },
}))

// jsdom also has no ResizeObserver; Starfield.tsx uses it to track canvas size.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  },
)

describe('Starfield', () => {
  it('keeps the date/time overlay collapsed to a toggle button by default', () => {
    render(<Starfield />)
    expect(screen.getByLabelText('日時を変更')).toBeTruthy()
    expect(screen.queryByLabelText('日時')).toBeNull()
  })

  it('recomputes star placement when the date/time is changed via the overlay', () => {
    render(<Starfield />)
    updateStars.mockClear()

    fireEvent.click(screen.getByLabelText('日時を変更'))
    // Regex, not exact match: the label also carries the observer location's
    // time zone (e.g. "日時 (Asia/Tokyo)") since Task 7.
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-01-01T00:00' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
  })

  it('keeps the location overlay collapsed to a toggle button by default', () => {
    render(<Starfield />)
    expect(screen.getByLabelText('場所を変更')).toBeTruthy()
    expect(screen.queryByLabelText('場所')).toBeNull()
  })

  it('recomputes star placement when the location is changed via the overlay', () => {
    render(<Starfield />)
    updateStars.mockClear()

    fireEvent.click(screen.getByLabelText('場所を変更'))
    fireEvent.change(screen.getByLabelText('場所'), {
      target: { value: 'ロンドン' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
  })

  describe('playback (Task 4)', () => {
    // jsdom has no real rAF loop; stub it so the playback clock's frames can
    // be advanced deterministically instead of relying on real timers.
    let queued: Map<number, FrameRequestCallback>
    let nextId: number
    // Saved/restored by hand (rather than vi.stubGlobal + unstubAllGlobals)
    // so we don't also tear down the file-level ResizeObserver stub above.
    const originalRaf = globalThis.requestAnimationFrame
    const originalCaf = globalThis.cancelAnimationFrame

    function flushFrame(nowMs: number): void {
      const callbacks = [...queued.values()]
      queued.clear()
      callbacks.forEach((callback) => callback(nowMs))
    }

    beforeEach(() => {
      queued = new Map()
      nextId = 0
      globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
        const id = ++nextId
        queued.set(id, callback)
        return id
      }
      globalThis.cancelAnimationFrame = (id: number) => {
        queued.delete(id)
      }
    })

    afterEach(() => {
      globalThis.requestAnimationFrame = originalRaf
      globalThis.cancelAnimationFrame = originalCaf
    })

    it('does not advance the date until playback starts', () => {
      render(<Starfield />)
      expect(queued.size).toBe(0)
    })

    it('recomputes star placement on each frame while playing', () => {
      render(<Starfield />)
      fireEvent.click(screen.getByLabelText('再生を開始'))
      updateStars.mockClear()

      flushFrame(1000)
      flushFrame(1100)
      expect(updateStars).toHaveBeenCalledTimes(1)

      flushFrame(1200)
      expect(updateStars).toHaveBeenCalledTimes(2)
    })

    it('stops advancing once paused', () => {
      render(<Starfield />)
      fireEvent.click(screen.getByLabelText('再生を開始'))
      flushFrame(1000)
      fireEvent.click(screen.getByLabelText('再生を停止'))

      expect(queued.size).toBe(0)
    })

    it('toggles between forward and reverse playback direction', () => {
      render(<Starfield />)
      expect(screen.getByLabelText('巻き戻し再生に切替')).toBeTruthy()

      fireEvent.click(screen.getByLabelText('巻き戻し再生に切替'))
      expect(screen.getByLabelText('順方向再生に切替')).toBeTruthy()
    })
  })
})
