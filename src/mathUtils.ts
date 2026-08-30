/**
 * Small numeric helpers shared across astronomy, rendering, and view/UI angle
 * math (coordinates.ts, skyProjection.ts, StarfieldRenderer.ts). Kept
 * dependency-free and framework-agnostic.
 */

export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Wraps degrees into [0, 360). */
export function normalizeDegrees(degrees: number): number {
  const wrapped = degrees % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}
