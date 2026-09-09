import type { SelectedStarInfo } from './stars/starInfo'
import { overlayButtonSizePx, overlayColors } from './overlayStyles'

interface StarInfoOverlayProps {
  info: SelectedStarInfo | null
  isOpen: boolean
  onClose: () => void
  onReopen: () => void
  onClearSelection: () => void
}

// Bottom safe-area spacing leaves room for device controls,
// with a button-height row (overlayButtonSizePx) plus 6px vertical padding on
// each side. This panel stacks just above it, plus an 8px gap, so the two
// never overlap.
const INFO_PANEL_BOTTOM_PX = 16 + overlayButtonSizePx + 12 + 8

/**
 * Shows the current selection's basic info + trivia (Task 5/7, D009): either
 * a tapped/searched star's name, brightness, color, and constellation
 * membership, or (Task 7) a constellation-only selection's name alone —
 * brightnessLabel/colorLabel are null in that case, so that line is omitted.
 * A selection can now outlive the descriptive panel itself: closing hides
 * only the text, while a separate explicit action clears the selection and
 * its constellation line/labels. When collapsed, this renders a compact
 * control strip so the user can reopen the description or clear the
 * selection without having to tap the same star again.
 */
export function StarInfoOverlay({
  info,
  isOpen,
  onClose,
  onReopen,
  onClearSelection,
}: StarInfoOverlayProps) {
  if (!info) return null

  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: `calc(${INFO_PANEL_BOTTOM_PX}px + env(safe-area-inset-bottom, 0px))`,
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 999,
          border: `1px solid ${overlayColors.border}`,
          background: overlayColors.panelBackground,
          color: overlayColors.text,
        }}
      >
        <button
          type="button"
          onClick={onReopen}
          aria-label="選択情報を開く"
          style={{
            border: 'none',
            background: 'transparent',
            color: overlayColors.text,
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 13,
          }}
        >
          説明を開く
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          aria-label="選択を解除する"
          style={{
            border: 'none',
            borderLeft: `1px solid ${overlayColors.border}`,
            background: 'transparent',
            color: overlayColors.text,
            cursor: 'pointer',
            padding: '2px 0 2px 8px',
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          線を消す
        </button>
      </div>
    )
  }

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
      {info.categoryLabel && (
        <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.72 }}>
          種別: {info.categoryLabel}
        </div>
      )}
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
      {info.detailLabel && (
        <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.75 }}>
          見え方: {info.detailLabel}
        </div>
      )}
      {info.trivia && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12.5,
            opacity: 0.75,
            lineHeight: 1.5,
          }}
        >
          {info.trivia}
        </div>
      )}
      <button
        type="button"
        onClick={onClearSelection}
        aria-label="選択を解除する"
        style={{
          marginTop: 10,
          padding: '6px 8px',
          borderRadius: 6,
          border: `1px solid ${overlayColors.border}`,
          background: 'transparent',
          color: overlayColors.text,
          cursor: 'pointer',
          fontSize: 12.5,
          opacity: 0.85,
        }}
      >
        線を消す
      </button>
    </div>
  )
}
