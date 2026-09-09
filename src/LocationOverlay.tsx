/**
 * Minimal location picker, shown as an overlay on top of the starfield
 * (D009), mirroring DateTimeOverlay.tsx's collapsed-toggle-button pattern
 * (Task 5) so the starfield stays the visual focus.
 *
 * Open/close state is owned by the parent (Starfield); see the note in
 * DateTimeOverlay.tsx.
 */

import type { ObserverLocation } from './astronomy/coordinates'
import { findLocationPreset, locationPresets } from './locationPresets'
import {
  overlayButtonGapPx,
  overlayButtonSizePx,
  overlayButtonStyle,
  overlayCornerMarginPx,
  overlayPanelStyle,
} from './overlayStyles'

/** Sits left of DateTimeOverlay's button in the same top-right row. */
const rightOffsetPx =
  overlayCornerMarginPx + overlayButtonSizePx + overlayButtonGapPx

interface LocationOverlayProps {
  location: ObserverLocation
  onChange: (location: ObserverLocation) => void
  isOpen: boolean
  onToggleOpen: () => void
}

interface LocationFieldProps {
  location: ObserverLocation
  onChange: (location: ObserverLocation) => void
}

/** Reusable location field so it can live inside the unified control menu. */
export function LocationField({ location, onChange }: LocationFieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      場所
      <select
        value={findLocationPreset(location).name}
        onChange={(event) => {
          const preset = locationPresets.find(
            (item) => item.name === event.target.value,
          )
          if (preset) onChange(preset.location)
        }}
        style={{ display: 'block', width: '100%', marginTop: 4 }}
      >
        {locationPresets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function LocationOverlay({
  location,
  onChange,
  isOpen,
  onToggleOpen,
}: LocationOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: overlayCornerMarginPx,
        right: rightOffsetPx,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label="場所を変更"
        aria-expanded={isOpen}
        style={overlayButtonStyle}
      >
        📍
      </button>

      {isOpen && (
        <div style={overlayPanelStyle('right')}>
          <LocationField location={location} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
