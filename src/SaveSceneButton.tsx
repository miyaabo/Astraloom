import {
  overlayBottomMarginPx,
  overlayBottomStackGapPx,
  overlayButtonSizePx,
  overlayColors,
  overlayCornerMarginPx,
  overlayPillButtonStyle,
} from './overlayStyles'

interface SaveSceneButtonProps {
  status: 'idle' | 'saved' | 'error'
  onSave: () => void
}

export function SaveSceneButton({ status, onSave }: SaveSceneButtonProps) {
  const statusText =
    status === 'saved'
      ? '保存済み'
      : status === 'error'
        ? '保存失敗'
        : null

  return (
    <div
      style={{
        position: 'fixed',
        left: overlayCornerMarginPx,
        bottom: `calc(${overlayBottomMarginPx}px + env(safe-area-inset-bottom, 0px) + ${overlayButtonSizePx}px + ${overlayBottomStackGapPx}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onSave}
        aria-label="現在のシーンを保存"
        style={overlayPillButtonStyle}
      >
        シーン保存
      </button>
      {statusText ? (
        <span
          aria-live="polite"
          style={{
            color: overlayColors.text,
            fontSize: 12,
            opacity: 0.72,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
          }}
        >
          {statusText}
        </span>
      ) : null}
    </div>
  )
}
