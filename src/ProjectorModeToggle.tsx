import {
  overlayBottomMarginPx,
  overlayColors,
  overlayCornerMarginPx,
  overlayPillButtonStyle,
} from './overlayStyles'

interface ProjectorModeToggleProps {
  isEnabled: boolean
  onToggle: () => void
}

export function ProjectorModeToggle({
  isEnabled,
  onToggle,
}: ProjectorModeToggleProps) {
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
        onClick={onToggle}
        aria-label={isEnabled ? 'プロジェクター補正を解除' : 'プロジェクター補正を有効化'}
        aria-pressed={isEnabled}
        style={{
          ...overlayPillButtonStyle,
          background: isEnabled
            ? 'rgba(8, 12, 22, 0.48)'
            : overlayColors.controlBackground,
        }}
      >
        {isEnabled ? '投影補正 ON' : '投影補正'}
      </button>
    </div>
  )
}
