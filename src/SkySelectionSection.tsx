import type { ObserverLocation } from './astronomy/coordinates'
import { DateTimeField } from './DateTimeOverlay'
import { LocationField } from './LocationOverlay'
import { overlayColors } from './overlayStyles'

interface SkySelectionSectionProps {
  date: Date
  location: ObserverLocation
  timeZoneId: string
  onDateChange: (date: Date) => void
  onLocationChange: (location: ObserverLocation) => void
}

/** Date and observer location controls inside the unified "空を選ぶ" section. */
export function SkySelectionSection({
  date,
  location,
  timeZoneId,
  onDateChange,
  onLocationChange,
}: SkySelectionSectionProps) {
  return (
    <div
      style={{
        padding: '12px 4px 4px',
        borderBottom: `1px solid ${overlayColors.border}`,
      }}
    >
      <DateTimeField
        date={date}
        onChange={onDateChange}
        timeZoneId={timeZoneId}
      />
      <LocationField location={location} onChange={onLocationChange} />
    </div>
  )
}
