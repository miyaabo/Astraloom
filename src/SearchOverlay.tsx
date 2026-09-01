/**
 * Minimal star/constellation search (Task 6), mirroring
 * DateTimeOverlay/LocationOverlay's collapsed-toggle-button pattern (D009)
 * but anchored to the top-left corner instead, so it doesn't compete with
 * that top-right pair. Matching is a simple case-insensitive substring
 * search over English/Japanese names (src/search/searchIndex.ts) —
 * phase-3-star-knowledge.md rules out a full-text search engine for this
 * scope.
 *
 * Open/close state is owned by the parent (Starfield), same as
 * DateTimeOverlay/LocationOverlay, so at most one overlay panel is open at a
 * time.
 */

import type { CelestialBodySearchRecord } from './celestialBodies/celestialBodyTypes'
import { useState } from 'react'
import type { ConstellationRecord } from './constellations/constellationTypes'
import {
  overlayButtonStyle,
  overlayColors,
  overlayCornerMarginPx,
  overlayPanelStyle,
} from './overlayStyles'
import { searchCatalog, searchResultDisplayName } from './search/searchIndex'
import type { HygStarRecord } from './stars/starTypes'

interface SearchOverlayProps {
  isOpen: boolean
  onToggleOpen: () => void
  onSelectCelestialBody: (celestialBody: CelestialBodySearchRecord) => void
  onSelectConstellation: (constellation: ConstellationRecord) => void
  onSelectStar: (star: HygStarRecord) => void
}

export function SearchOverlay({
  isOpen,
  onToggleOpen,
  onSelectCelestialBody,
  onSelectConstellation,
  onSelectStar,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const results = searchCatalog(query)

  return (
    <div
      style={{
        position: 'fixed',
        top: overlayCornerMarginPx,
        left: overlayCornerMarginPx,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label="星・星座を検索"
        aria-expanded={isOpen}
        style={overlayButtonStyle}
      >
        🔍
      </button>

      {isOpen && (
        <div style={{ ...overlayPanelStyle('left'), minWidth: 200 }}>
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
                const key = (() => {
                  if (result.type === 'constellation') {
                    return `constellation-${result.constellation.name}`
                  }

                  if (result.type === 'celestialBody') {
                    return `celestial-${result.celestialBody.id}`
                  }

                  return `star-${result.star.id}`
                })()
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => {
                        if (result.type === 'constellation') {
                          onSelectConstellation(result.constellation)
                          return
                        }

                        if (result.type === 'celestialBody') {
                          onSelectCelestialBody(result.celestialBody)
                          return
                        }

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
        </div>
      )}
    </div>
  )
}
