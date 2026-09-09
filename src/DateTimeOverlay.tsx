/**
 * Minimal date/time picker, shown as an overlay on top of the starfield
 * rather than a separate settings page (D009). Collapsed to a small toggle
 * button by default so the starfield stays the visual focus (Task 5).
 *
 * Open/close state is owned by the parent (Starfield) rather than kept
 * locally, so it can enforce that at most one overlay panel is open at a
 * time — with both anchored to the same top-right corner (LocationOverlay),
 * two open panels would overlap.
 *
 * The input is interpreted/displayed in the selected observer location's
 * own time zone (`timeZoneId`), not the browser's — otherwise picking a
 * date/time while viewing a distant location's sky would silently apply
 * the wrong instant (Task 7 — see src/civilTime.ts).
 */

import { utcToZonedWallClock, zonedWallClockToUtc } from './civilTime'
import {
  overlayButtonStyle,
  overlayCornerMarginPx,
  overlayPanelStyle,
} from './overlayStyles'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Formats a Date as the wall-clock value `<input type="datetime-local">` expects, in the given time zone. */
function toDateTimeLocalValue(date: Date, timeZoneId: string): string {
  const { year, month, day, hour, minute } = utcToZonedWallClock(
    date,
    timeZoneId,
  )
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

/** Parses an `<input type="datetime-local">` value as wall-clock time in the given time zone. Returns null if incomplete/invalid. */
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

interface DateTimeOverlayProps {
  date: Date
  onChange: (date: Date) => void
  isOpen: boolean
  onToggleOpen: () => void
  /** IANA time zone of the currently selected observer location. */
  timeZoneId: string
}

interface DateTimeFieldProps {
  date: Date
  onChange: (date: Date) => void
  /** IANA time zone of the currently selected observer location. */
  timeZoneId: string
}

/** Reusable date field so it can live inside the unified control menu. */
export function DateTimeField({
  date,
  onChange,
  timeZoneId,
}: DateTimeFieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      日時 <span style={{ opacity: 0.6, fontSize: 12 }}>({timeZoneId})</span>
      <input
        type="datetime-local"
        value={toDateTimeLocalValue(date, timeZoneId)}
        onChange={(event) => {
          const parsed = fromDateTimeLocalValue(event.target.value, timeZoneId)
          if (parsed) onChange(parsed)
        }}
        style={{ display: 'block', width: '100%', marginTop: 4 }}
      />
    </label>
  )
}

export function DateTimeOverlay({
  date,
  onChange,
  isOpen,
  onToggleOpen,
  timeZoneId,
}: DateTimeOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: overlayCornerMarginPx,
        right: overlayCornerMarginPx,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label="日時を変更"
        aria-expanded={isOpen}
        style={overlayButtonStyle}
      >
        🕐
      </button>

      {isOpen && (
        <div style={overlayPanelStyle('right')}>
          <DateTimeField
            date={date}
            onChange={onChange}
            timeZoneId={timeZoneId}
          />
        </div>
      )}
    </div>
  )
}
