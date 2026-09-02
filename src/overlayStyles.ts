import { starfieldConfig } from './stars/starfieldConfig'
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
  border: `var(--overlay-border, rgba(255, 255, 255, 0.25))`,
  controlBackground: `var(--overlay-control-background, rgba(5, 7, 15, 0.55))`,
  panelBackground: `var(--overlay-panel-background, rgba(5, 7, 15, 0.85))`,
  text: `var(--overlay-text, #ffffff)`,
}

/**
 * Projector correction and Night Mode UI (10次, D029) are independent
 * toggles that both only recolor overlay chrome. When both are on,
 * projector correction wins — it targets legibility in a fixed dark-room
 * projection setup, a more specific constraint than Night Mode UI's general
 * pre-sleep dimming.
 */
export function applyOverlayAppearance(
  isProjectorMode: boolean,
  isNightModeUi: boolean,
): void {
  const rootStyle = document.documentElement.style
  let appearance = {
    border: 'rgba(255, 255, 255, 0.25)',
    controlBackground: 'rgba(5, 7, 15, 0.55)',
    panelBackground: 'rgba(5, 7, 15, 0.85)',
    text: '#ffffff',
  }
  if (isProjectorMode) {
    appearance = starfieldConfig.projector.overlay
  } else if (isNightModeUi) {
    appearance = starfieldConfig.nightModeUi.overlay
  }

  rootStyle.setProperty('--overlay-border', appearance.border)
  rootStyle.setProperty(
    '--overlay-control-background',
    appearance.controlBackground,
  )
  rootStyle.setProperty('--overlay-panel-background', appearance.panelBackground)
  rootStyle.setProperty('--overlay-text', appearance.text)
}

/** Size (px) and gap of the circular toggle buttons anchored to the corners. */
export const overlayButtonSizePx = 36
export const overlayButtonGapPx = 8
/** Distance (px) from the viewport edge for the top-right button row (DateTimeOverlay, LocationOverlay). */
export const overlayCornerMarginPx = 12
/** Shared bottom inset for persistent overlay controls. */
export const overlayBottomMarginPx = 12
/** Gap between stacked bottom overlay rows. */
export const overlayBottomStackGapPx = 8

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

export const overlayPillButtonStyle: CSSProperties = {
  minHeight: overlayButtonSizePx,
  padding: '0 12px',
  borderRadius: 999,
  border: `1px solid ${overlayColors.border}`,
  background: overlayColors.controlBackground,
  color: overlayColors.text,
  fontSize: 13,
  cursor: 'pointer',
}

/**
 * Dropdown panel anchored to a toggle button, on whichever side that button
 * sits (DateTimeOverlay/LocationOverlay on the right, SearchOverlay on the
 * left — Task 6) and in whichever direction it should open (down by default;
 * up for a trigger anchored to the bottom of the screen, e.g. SettingsOverlay
 * — 10次 D030).
 */
export function overlayPanelStyle(
  anchor: 'left' | 'right',
  direction: 'down' | 'up' = 'down',
): CSSProperties {
  return {
    position: 'absolute',
    ...(direction === 'up' ? { bottom: '100%' } : { top: '100%' }),
    [anchor]: 0,
    ...(direction === 'up' ? { marginBottom: 8 } : { marginTop: 8 }),
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
