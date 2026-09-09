import type { CelestialBodySearchRecord } from './celestialBodies/celestialBodyTypes'
import { useState } from 'react'
import type { ConstellationRecord } from './constellations/constellationTypes'
import { overlayColors } from './overlayStyles'
import { searchCatalog, searchResultDisplayName } from './search/searchIndex'
import { buildSelectionOptions } from './search/selectionCatalog'
import type { HygStarRecord } from './stars/starTypes'

interface SearchSectionProps {
  onSelectCelestialBody: (value: CelestialBodySearchRecord) => void
  onSelectConstellation: (value: ConstellationRecord) => void
  onSelectStar: (value: HygStarRecord) => void
  onSelectBrowseCelestialBody: (value: CelestialBodySearchRecord) => void
  onSelectBrowseConstellation: (value: ConstellationRecord) => void
  onSelectBrowseStar: (value: HygStarRecord) => void
  onSelectNextConstellation: () => void
}

export function SearchSection({
  onSelectCelestialBody,
  onSelectConstellation,
  onSelectStar,
  onSelectBrowseCelestialBody,
  onSelectBrowseConstellation,
  onSelectBrowseStar,
  onSelectNextConstellation,
}: SearchSectionProps) {
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const results = searchCatalog(query)
  const selectionOptions = buildSelectionOptions()

  return (
    <div
      style={{
        padding: '12px 4px',
        borderBottom: `1px solid ${overlayColors.border}`,
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="星座名・星名・主要天体で検索"
        aria-label="星座名・星名・主要天体で検索"
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          fontSize: 16,
          borderRadius: 6,
          border: `1px solid ${overlayColors.border}`,
          background: overlayColors.controlBackground,
          color: overlayColors.text,
        }}
      />
      {trimmedQuery.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '8px 0 0',
            padding: 0,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {results.length === 0 && (
            <li style={{ opacity: 0.6, padding: '4px 2px' }}>該当なし</li>
          )}
          {results.map((result) => {
            const key =
              result.type === 'constellation'
                ? `constellation-${result.constellation.name}`
                : result.type === 'celestialBody'
                  ? `celestial-${result.celestialBody.id}`
                  : `star-${result.star.id}`
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    if (result.type === 'constellation')
                      return onSelectConstellation(result.constellation)
                    if (result.type === 'celestialBody')
                      return onSelectCelestialBody(result.celestialBody)
                    onSelectStar(result.star)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 4px',
                    border: 'none',
                    background: 'transparent',
                    color: overlayColors.text,
                    cursor: 'pointer',
                  }}
                >
                  {searchResultDisplayName(result)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${overlayColors.border}`,
        }}
      >
        <label
          htmlFor="menu-selection-select"
          style={{ display: 'block', marginBottom: 6, fontSize: 13 }}
        >
          選択して移動
        </label>
        <select
          id="menu-selection-select"
          aria-label="天体・星・星座を選択"
          defaultValue=""
          onChange={(event) => {
            const selected = selectionOptions.find(
              (option) => option.value === event.target.value,
            )
            if (!selected) return

            if (selected.type === 'celestialBody') {
              onSelectBrowseCelestialBody(selected.celestialBody)
            } else if (selected.type === 'constellation') {
              onSelectBrowseConstellation(selected.constellation)
            } else {
              onSelectBrowseStar(selected.star)
            }

            event.currentTarget.value = ''
          }}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${overlayColors.border}`,
            background: overlayColors.controlBackground,
            color: overlayColors.text,
            fontSize: 13,
          }}
        >
          <option value="">天体・星・星座を選択...</option>
          <optgroup label="主要天体">
            {selectionOptions
              .filter((option) => option.type === 'celestialBody')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="星座">
            {selectionOptions
              .filter((option) => option.type === 'constellation')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="名前付きの星">
            {selectionOptions
              .filter((option) => option.type === 'star')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
        </select>
        <button
          type="button"
          onClick={onSelectNextConstellation}
          style={{
            marginTop: 10,
            padding: '6px 8px',
            border: `1px solid ${overlayColors.border}`,
            borderRadius: 6,
            background: overlayColors.controlBackground,
            color: overlayColors.text,
            cursor: 'pointer',
          }}
        >
          次の見やすい星座へ
        </button>
      </div>
    </div>
  )
}
