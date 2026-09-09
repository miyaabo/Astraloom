import type { PlaybackDirection } from './playback/playbackTime'
import {
  overlayButtonStyle,
  overlayColors,
  overlayVisuallyHiddenStyle,
} from './overlayStyles'

interface TimeControlsSectionProps {
  isPlaying: boolean
  onTogglePlaying: () => void
  speedMagnitude: number
  onSpeedChange: (speedMagnitude: number) => void
  direction: PlaybackDirection
  onToggleDirection: () => void
  onReturnToCurrentTime: () => void
}

const speedPresetMagnitudes = [
  1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000,
  20000, 30000, 50000, 86400,
]

/** Playback controls inside the unified "時間を動かす" section. */
export function TimeControlsSection({
  isPlaying,
  onTogglePlaying,
  speedMagnitude,
  onSpeedChange,
  direction,
  onToggleDirection,
  onReturnToCurrentTime,
}: TimeControlsSectionProps) {
  return (
    <div
      style={{
        padding: '12px 4px',
        borderBottom: `1px solid ${overlayColors.border}`,
      }}
    >
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
          aria-label={
            direction === 1 ? '巻き戻し再生に切替' : '順方向再生に切替'
          }
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
            {speedPresetMagnitudes.map((magnitude) => (
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
    </div>
  )
}
