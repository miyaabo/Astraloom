import type { ObserverLocation } from './astronomy/coordinates'
import { utcToZonedWallClock, zonedWallClockToUtc } from './civilTime'
import { findLocationPreset, locationPresets } from './locationPresets'
import { overlayColors } from './overlayStyles'

interface SkySelectionSectionProps {
  date: Date
  location: ObserverLocation
  timeZoneId: string
  onDateChange: (date: Date) => void
  onLocationChange: (location: ObserverLocation) => void
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateTimeLocalValue(date: Date, timeZoneId: string): string {
  const { year, month, day, hour, minute } = utcToZonedWallClock(
    date,
    timeZoneId,
  )
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

function fromDateTimeLocalValue(
  value: string,
  timeZoneId: string,
): Date | null {
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if ([year, month, day, hour, minute].some(Number.isNaN)) return null

  const date = zonedWallClockToUtc(
    { year, month, day, hour, minute },
    timeZoneId,
  )
  return Number.isNaN(date.getTime()) ? null : date
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
      <label style={{ display: 'block', marginBottom: 12 }}>
        日時 <span style={{ opacity: 0.6, fontSize: 12 }}>({timeZoneId})</span>
        <input
          type="datetime-local"
          value={toDateTimeLocalValue(date, timeZoneId)}
          onChange={(event) => {
            const parsed = fromDateTimeLocalValue(
              event.target.value,
              timeZoneId,
            )
            if (parsed) onDateChange(parsed)
          }}
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        場所
        <select
          value={findLocationPreset(location).name}
          onChange={(event) => {
            const preset = locationPresets.find(
              (item) => item.name === event.target.value,
            )
            if (preset) onLocationChange(preset.location)
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
    </div>
  )
}
