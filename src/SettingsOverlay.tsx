/**
 * Minimal settings panel consolidating environment/scene toggles that are
 * changed occasionally (not every session) — projector correction, Night
 * Mode UI, and fullscreen (hides the browser chrome that eats into the
 * projected image when mirroring to a projector). First concrete
 * implementation of D009's "future settings UI is an overlay over the
 * starfield" direction (10次 D030).
 *
 * Immersive mode is deliberately NOT included here — it's a high-frequency,
 * one-tap action (D030), so it stays its own standalone toggle
 * (ImmersiveModeToggle) rather than being buried behind this panel.
 *
 * Open/close state is owned by the parent (Starfield), matching
 * DateTimeOverlay/LocationOverlay's pattern, so only one overlay panel is
 * ever open at a time.
 */

import {
  overlayBottomMarginPx,
  overlayButtonStyle,
  overlayColors,
  overlayCornerMarginPx,
  overlayPanelStyle,
  overlayPillButtonStyle,
} from './overlayStyles'

interface SettingsOverlayProps {
  isOpen: boolean
  onToggleOpen: () => void
  isProjectorMode: boolean
  onToggleProjectorMode: () => void
  isNightModeUi: boolean
  onToggleNightModeUi: () => void
  /** Hidden entirely on browsers without the Fullscreen API (e.g. iOS Safari) rather than shown as a dead button. */
  isFullscreenSupported: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

const rowToggleStyle = {
  ...overlayPillButtonStyle,
  minHeight: 28,
  padding: '0 10px',
  fontSize: 12,
}

export function SettingsOverlay({
  isOpen,
  onToggleOpen,
  isProjectorMode,
  onToggleProjectorMode,
  isNightModeUi,
  onToggleNightModeUi,
  isFullscreenSupported,
  isFullscreen,
  onToggleFullscreen,
}: SettingsOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: overlayCornerMarginPx,
        bottom: `calc(${overlayBottomMarginPx}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={isOpen ? '設定を閉じる' : '設定を開く'}
        aria-expanded={isOpen}
        style={overlayButtonStyle}
      >
        ⚙️
      </button>

      {isOpen && (
        <div style={overlayPanelStyle('left', 'up')}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              minWidth: 180,
            }}
          >
            <span>プロジェクター補正</span>
            <button
              type="button"
              onClick={onToggleProjectorMode}
              aria-label={
                isProjectorMode ? 'プロジェクター補正を解除' : 'プロジェクター補正を有効化'
              }
              aria-pressed={isProjectorMode}
              style={{
                ...rowToggleStyle,
                background: isProjectorMode
                  ? 'rgba(8, 12, 22, 0.48)'
                  : overlayColors.controlBackground,
              }}
            >
              {isProjectorMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: 10,
            }}
          >
            <span>夜間モード</span>
            <button
              type="button"
              onClick={onToggleNightModeUi}
              aria-label={
                isNightModeUi ? '夜間モードを解除' : '夜間モードを有効化'
              }
              aria-pressed={isNightModeUi}
              style={{
                ...rowToggleStyle,
                background: isNightModeUi
                  ? 'rgba(10, 6, 4, 0.6)'
                  : overlayColors.controlBackground,
              }}
            >
              {isNightModeUi ? 'ON' : 'OFF'}
            </button>
          </div>

          {isFullscreenSupported && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 10,
              }}
            >
              <span>フルスクリーン</span>
              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={
                  isFullscreen
                    ? 'フルスクリーン表示を終了'
                    : 'フルスクリーン表示にする'
                }
                aria-pressed={isFullscreen}
                style={{
                  ...rowToggleStyle,
                  background: isFullscreen
                    ? 'rgba(8, 12, 22, 0.48)'
                    : overlayColors.controlBackground,
                }}
              >
                {isFullscreen ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
