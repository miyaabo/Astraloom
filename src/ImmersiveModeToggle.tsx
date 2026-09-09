import {
  overlayBottomMarginPx,
  overlayBottomStackGapPx,
  overlayButtonSizePx,
  overlayColors,
  overlayCornerMarginPx,
  overlayPillButtonStyle,
} from './overlayStyles'

interface ImmersiveModeToggleProps {
  isImmersive: boolean
  onToggle: () => void
}

/** A direct entry to distraction-free viewing, separate from auto-hide. */
export function ImmersiveModeToggle({
  isImmersive,
  onToggle,
}: ImmersiveModeToggleProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: overlayCornerMarginPx,
        bottom: `calc(${overlayBottomMarginPx}px + env(safe-area-inset-bottom, 0px) + ${overlayButtonSizePx}px + ${overlayBottomStackGapPx}px)`,
        zIndex: 3,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isImmersive ? '通常表示に戻る' : '鑑賞モードに切替'}
        aria-pressed={isImmersive}
        style={{
          ...overlayPillButtonStyle,
          background: isImmersive
            ? 'rgba(5, 7, 15, 0.78)'
            : overlayColors.controlBackground,
        }}
      >
        {isImmersive ? '戻る' : '鑑賞'}
      </button>
    </div>
  )
}
