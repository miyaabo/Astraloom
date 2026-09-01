import type { CelestialBodySearchRecord } from './celestialBodies/celestialBodyTypes'
import type { ConstellationRecord } from './constellations/constellationTypes'
import {
  overlayButtonGapPx,
  overlayButtonSizePx,
  overlayColors,
  overlayCornerMarginPx,
  overlayPanelStyle,
  overlayVisuallyHiddenStyle,
} from './overlayStyles'
import { buildSelectionOptions } from './search/selectionCatalog'
import type { HygStarRecord } from './stars/starTypes'

interface SelectionOverlayProps {
  onSelectCelestialBody: (celestialBody: CelestialBodySearchRecord) => void
  onSelectConstellation: (constellation: ConstellationRecord) => void
  onSelectStar: (star: HygStarRecord) => void
}

export function SelectionOverlay({
  onSelectCelestialBody,
  onSelectConstellation,
  onSelectStar,
}: SelectionOverlayProps) {
  const options = buildSelectionOptions()
  const topOffsetPx =
    overlayCornerMarginPx + overlayButtonSizePx + overlayButtonGapPx

  return (
    <div
      style={{
        position: 'fixed',
        top: topOffsetPx,
        left: overlayCornerMarginPx,
        zIndex: 1,
      }}
    >
      <div
        style={{
          ...overlayPanelStyle('left'),
          position: 'static',
          marginTop: 0,
          padding: 8,
        }}
      >
        <label htmlFor="selection-overlay-select" style={overlayVisuallyHiddenStyle}>
          天体・星・星座を選択
        </label>
        <select
          id="selection-overlay-select"
          aria-label="天体・星・星座を選択"
          defaultValue=""
          onChange={(event) => {
            const selected = options.find((option) => option.value === event.target.value)
            if (!selected) return

            if (selected.type === 'celestialBody') {
              onSelectCelestialBody(selected.celestialBody)
            } else if (selected.type === 'constellation') {
              onSelectConstellation(selected.constellation)
            } else {
              onSelectStar(selected.star)
            }

            event.currentTarget.value = ''
          }}
          style={{
            minWidth: 220,
            maxWidth: 'min(320px, calc(100vw - 24px))',
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${overlayColors.border}`,
            background: overlayColors.controlBackground,
            color: overlayColors.text,
            fontSize: 13,
          }}
        >
          <option value="">選択して移動...</option>
          <optgroup label="主要天体">
            {options
              .filter((option) => option.type === 'celestialBody')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="星座">
            {options
              .filter((option) => option.type === 'constellation')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="名前付きの星">
            {options
              .filter((option) => option.type === 'star')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
        </select>
      </div>
    </div>
  )
}
