import type { SelectedStarInfo } from './stars/starInfo'
import { overlayButtonSizePx, overlayColors } from './overlayStyles'

interface StarInfoOverlayProps {
  info: SelectedStarInfo | null
  onClose: () => void
}

// PlaybackOverlay (src/PlaybackOverlay.tsx) sits at bottom: 16px + safe-area,
// with a button-height row (overlayButtonSizePx) plus 6px vertical padding on
// each side. This panel stacks just above it, plus an 8px gap, so the two
// never overlap.
const INFO_PANEL_BOTTOM_PX = 16 + overlayButtonSizePx + 12 + 8

/**
 * Shows the current selection's basic info + trivia (Task 5/7, D009): either
 * a tapped/searched star's name, brightness, color, and constellation
 * membership, or (Task 7) a constellation-only selection's name alone —
 * brightnessLabel/colorLabel are null in that case, so that line is omitted.
 * Renders nothing when nothing is selected, and closing it returns to the
 * plain starfield (D017 / Product Principle 5 — nothing about the selection
 * stays on screen once deselected).
 */
export function StarInfoOverlay({ info, onClose }: StarInfoOverlayProps) {
  if (!info) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: `calc(${INFO_PANEL_BOTTOM_PX}px + env(safe-area-inset-bottom, 0px))`,
        transform: 'translateX(-50%)',
        zIndex: 2,
        minWidth: 220,
        maxWidth: '90vw',
        padding: '10px 14px',
        borderRadius: 10,
        border: `1px solid ${overlayColors.border}`,
        background: overlayColors.panelBackground,
        color: overlayColors.text,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <strong style={{ fontSize: 15 }}>{info.displayName}</strong>
        <button
          type="button"
          onClick={onClose}
          aria-label="選択情報を閉じる"
          style={{
            border: 'none',
            background: 'transparent',
            color: overlayColors.text,
            opacity: 0.7,
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      {info.brightnessLabel && info.colorLabel && (
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
          明るさ: {info.brightnessLabel} / 色: {info.colorLabel}
          {info.constellationLabel && (
            <>
              <br />
              所属: {info.constellationLabel}
            </>
          )}
        </div>
      )}
      {info.trivia && (
        <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.75, lineHeight: 1.5 }}>
          {info.trivia}
        </div>
      )}
    </div>
  )
}
