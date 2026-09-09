import type { CelestialBodySearchRecord } from './celestialBodies/celestialBodyTypes'
import type { ConstellationRecord } from './constellations/constellationTypes'
import { overlayColors } from './overlayStyles'
import { SearchContent } from './SearchOverlay'
import type { HygStarRecord } from './stars/starTypes'

interface SearchSectionProps { onSelectCelestialBody: (value: CelestialBodySearchRecord) => void; onSelectConstellation: (value: ConstellationRecord) => void; onSelectStar: (value: HygStarRecord) => void }
export function SearchSection(props: SearchSectionProps) { return <div style={{ padding: '12px 4px', borderBottom: `1px solid ${overlayColors.border}` }}><SearchContent {...props} /></div> }
