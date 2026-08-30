import type { CSSProperties } from 'react'

/**
 * Shared visual language for the starfield's overlay controls (Task 6:
 * docs/features/phase-2-implementation-tasks.md). Centralized here so
 * DateTimeOverlay/LocationOverlay/PlaybackOverlay stay visually consistent
 * as more controls are added, instead of each re-declaring the same colors
 * and dimensions (D009: overlays sit directly on the starfield, so a
 * consistent low-contrast look keeps them from competing with it).
 */
export const overlayColors = {
  border: 'rgba(255, 255, 255, 0.25)',
  controlBackground: 'rgba(5, 7, 15, 0.55)',
  panelBackground: 'rgba(5, 7, 15, 0.85)',
  text: '#ffffff',
}

/** Size (px) and gap of the circular toggle buttons anchored to the corners. */
export const overlayButtonSizePx = 36
export const overlayButtonGapPx = 8
/** Distance (px) from the viewport edge for the top-right button row (DateTimeOverlay, LocationOverlay). */
export const overlayCornerMarginPx = 12

export const overlayButtonStyle: CSSProperties = {
  width: overlayButtonSizePx,
  height: overlayButtonSizePx,
  borderRadius: '50%',
  border: `1px solid ${overlayColors.border}`,
  background: overlayColors.controlBackground,
  color: overlayColors.text,
  fontSize: 16,
  cursor: 'pointer',
}

/**
 * Dropdown panel anchored below a toggle button, on whichever side that
 * button sits (DateTimeOverlay/LocationOverlay on the right, SearchOverlay on
 * the left — Task 6).
 */
export function overlayPanelStyle(anchor: 'left' | 'right'): CSSProperties {
  return {
    position: 'absolute',
    top: '100%',
    [anchor]: 0,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${overlayColors.border}`,
    background: overlayColors.panelBackground,
    color: overlayColors.text,
    fontSize: 14,
  }
}

/** Visually-hidden but screen-reader-visible label, for controls whose icon/value is self-explanatory visually. */
export const overlayVisuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
}
