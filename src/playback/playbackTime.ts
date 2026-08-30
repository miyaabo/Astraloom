/**
 * Pure time-advancement math for playback (Task 4:
 * docs/features/phase-2-implementation-tasks.md), kept separate from the
 * requestAnimationFrame loop (usePlaybackClock.ts) so it can be unit tested
 * without a browser environment.
 */

/** Forward (1) or reverse (-1) playback direction. */
export type PlaybackDirection = 1 | -1

/**
 * Computes the next simulated Date after `deltaRealMs` of wall-clock time
 * elapses during playback, at `speedMagnitude` simulated seconds per real
 * second and the given direction.
 */
export function advancePlaybackDate(
  date: Date,
  deltaRealMs: number,
  speedMagnitude: number,
  direction: PlaybackDirection,
): Date {
  return new Date(date.getTime() + deltaRealMs * speedMagnitude * direction)
}

/**
 * Caps how often a playback tick actually triggers a star recompute (Task 5:
 * docs/features/phase-2-implementation-tasks.md). Recomputing on every rAF
 * tick (up to 60Hz) was measured — via CPU throttling in Chromium,
 * approximating mid/low-tier mobile — to drop frame rate well below 30fps
 * during playback (idle/paused frame timing was a clean 60fps at the same
 * throttle, isolating the recompute+geometry-rebuild path as the cost).
 * 15Hz keeps recompute cost bounded while remaining smooth for the slow,
 * drifting motion of star playback; the render loop's own twinkle/drift
 * still runs every frame regardless.
 */
export const PLAYBACK_RECOMPUTE_INTERVAL_MS = 1000 / 15

export interface PlaybackTickResult {
  /** Real-time accumulator to carry into the next tick. */
  nextPendingRealMs: number
  /**
   * Real ms elapsed since the last recompute, or `null` if the accumulated
   * time hasn't yet crossed `PLAYBACK_RECOMPUTE_INTERVAL_MS` and no
   * recompute should happen this tick.
   */
  elapsedRealMs: number | null
}

/**
 * Accumulates real time across ticks and reports when enough has built up to
 * warrant a recompute, throttling to `PLAYBACK_RECOMPUTE_INTERVAL_MS`
 * regardless of how often the caller's animation loop actually ticks.
 */
export function accumulatePlaybackTick(
  pendingRealMs: number,
  deltaRealMs: number,
): PlaybackTickResult {
  const total = pendingRealMs + deltaRealMs
  if (total < PLAYBACK_RECOMPUTE_INTERVAL_MS) {
    return { nextPendingRealMs: total, elapsedRealMs: null }
  }
  return { nextPendingRealMs: 0, elapsedRealMs: total }
}
