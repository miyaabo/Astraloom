import type { StarfieldVisualPresetKey } from './stars/starfieldConfig'
import { resolveStarfieldVisualPreset } from './stars/starfieldConfig'
import {
  overlayBottomMarginPx,
  overlayColors,
  overlayCornerMarginPx,
  overlayPillButtonStyle,
  overlayVisuallyHiddenStyle,
} from './overlayStyles'

interface VisualPresetOverlayProps {
  preset: StarfieldVisualPresetKey
  onChange: (preset: StarfieldVisualPresetKey) => void
}

const PRESET_OPTIONS: StarfieldVisualPresetKey[] = [
  'planetarium-like',
  'gentle-contrast',
]

export function VisualPresetOverlay({
  preset,
  onChange,
}: VisualPresetOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: overlayCornerMarginPx,
        bottom: `calc(${overlayBottomMarginPx}px + env(safe-area-inset-bottom, 0px) + 44px)`,
        zIndex: 1,
      }}
    >
      <label style={{ display: 'block' }}>
        <span style={overlayVisuallyHiddenStyle}>表現プリセット</span>
        <select
          aria-label="表現プリセット"
          value={preset}
          onChange={(event) =>
            onChange(event.target.value as StarfieldVisualPresetKey)
          }
          style={{
            ...overlayPillButtonStyle,
            paddingRight: 28,
            background: overlayColors.controlBackground,
          }}
        >
          {PRESET_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {resolveStarfieldVisualPreset(option).label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
