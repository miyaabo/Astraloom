import type { PlaybackDirection } from './playback/playbackTime'
import {
  overlayButtonStyle,
  overlayColors,
  overlayVisuallyHiddenStyle,
} from './overlayStyles'

/**
 * Minimal playback controls (Task 4:
 * docs/features/phase-2-implementation-tasks.md) — play/pause, a speed
 * preset, and a direction toggle. Kept as a small always-visible strip
 * rather than the collapsed-toggle-panel pattern used by
 * DateTimeOverlay/LocationOverlay, since these controls (unlike date/location
 * settings) are the primary thing a viewer interacts with during playback.
 * View/sphere orientation has its own small overlay instead
 * (Task 6: CompassOverlay.tsx), so this strip stays play/pause/speed/direction
 * only.
 */

// Real-time-relative multipliers (real time = 1x), like a video player's
// speed control, with finer low-end steps (1/2/3/5 per decade) so a
// comfortable pace can be dialed in instead of jumping straight to a fast
// preset. Capped at 86400x (one full day per real second).
const SPEED_PRESET_MAGNITUDES = [
  1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000,
  20000, 30000, 50000, 86400,
]

interface PlaybackControlsProps {
  isPlaying: boolean
  onTogglePlaying: () => void
  speedMagnitude: number
  onSpeedChange: (speedMagnitude: number) => void
  direction: PlaybackDirection
  onToggleDirection: () => void
  onReturnToCurrentTime: () => void
}

/** Reusable controls for the unified "時間を動かす" section. */
export function PlaybackControls({
  isPlaying,
  onTogglePlaying,
  speedMagnitude,
  onSpeedChange,
  direction,
  onToggleDirection,
  onReturnToCurrentTime,
}: PlaybackControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={onToggleDirection}
        aria-label={direction === 1 ? '巻き戻し再生に切替' : '順方向再生に切替'}
        style={overlayButtonStyle}
      >
        {direction === 1 ? '⏩' : '⏪'}
      </button>

      <button
        type="button"
        onClick={onTogglePlaying}
        aria-label={isPlaying ? '再生を停止' : '再生を開始'}
        style={overlayButtonStyle}
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>

      <label>
        <span style={overlayVisuallyHiddenStyle}>再生速度</span>
        <select
          aria-label="再生速度"
          value={speedMagnitude}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          style={{
            background: overlayColors.controlBackground,
            color: overlayColors.text,
            border: `1px solid ${overlayColors.border}`,
            borderRadius: 6,
            padding: '4px 6px',
          }}
        >
          {SPEED_PRESET_MAGNITUDES.map((magnitude) => (
            <option key={magnitude} value={magnitude}>
              {magnitude.toLocaleString('ja-JP')}倍速
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onReturnToCurrentTime}
        style={{
          border: `1px solid ${overlayColors.border}`,
          borderRadius: 6,
          padding: '6px 8px',
          background: overlayColors.controlBackground,
          color: overlayColors.text,
          cursor: 'pointer',
        }}
      >
        現在時刻へ戻す
      </button>
    </div>
  )
}

type PlaybackOverlayProps = PlaybackControlsProps

/**
 * Legacy floating wrapper. Task 4 moves its controls into the unified menu;
 * the wrapper remains temporarily for compatibility until Task 7 cleanup.
 */
export function PlaybackOverlay(props: PlaybackOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 10px',
        borderRadius: 24,
        border: `1px solid ${overlayColors.border}`,
        background: overlayColors.controlBackground,
        color: overlayColors.text,
        zIndex: 1,
      }}
    >
      <PlaybackControls {...props} />
    </div>
  )
}
