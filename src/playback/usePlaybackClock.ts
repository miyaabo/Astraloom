import { useEffect, useRef } from 'react'
import { watchVisibility } from '../render/visibility'

/**
 * Drives a requestAnimationFrame loop while `isPlaying` is true, calling
 * `onTick` with the elapsed real time (ms) since the previous frame. Pauses
 * while the tab is hidden, mirroring StarfieldRenderer's own visibility
 * handling (CLAUDE.md: no unnecessary work in a background tab).
 *
 * Only drives the loop's timing; what a tick means (how far to move the
 * simulated date) is Starfield.tsx's concern via `onTick` — see
 * playbackTime.ts for that pure calculation.
 */
export function usePlaybackClock(
  isPlaying: boolean,
  onTick: (deltaRealMs: number) => void,
): void {
  const onTickRef = useRef(onTick)
  useEffect(() => {
    onTickRef.current = onTick
  })

  useEffect(() => {
    if (!isPlaying) return

    let rafId: number | null = null
    let lastFrameMs: number | null = null

    function frame(nowMs: number): void {
      if (lastFrameMs !== null) {
        onTickRef.current(nowMs - lastFrameMs)
      }
      lastFrameMs = nowMs
      rafId = requestAnimationFrame(frame)
    }

    function startLoop(): void {
      if (rafId !== null) return
      lastFrameMs = null
      rafId = requestAnimationFrame(frame)
    }

    function stopLoop(): void {
      if (rafId === null) return
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const unwatchVisibility = watchVisibility((visible) => {
      if (visible) startLoop()
      else stopLoop()
    })

    return () => {
      unwatchVisibility()
      stopLoop()
    }
  }, [isPlaying])
}
