/**
 * Civil wall-clock <-> UTC conversion for an IANA time zone, using only the
 * built-in `Intl` API (no date/time-zone library — see D007/D010). This is
 * a generic civil-time concern, independent of the astronomy math in
 * `src/astronomy/` (Task 7: docs/features/phase-1-implementation-tasks.md).
 */

export interface WallClockComponents {
  year: number
  /** 1-12 */
  month: number
  day: number
  hour: number
  minute: number
}

function getZonedParts(date: Date, timeZoneId: string): WallClockComponents {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZoneId,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const lookup = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: lookup('year'),
    month: lookup('month'),
    day: lookup('day'),
    // Some ICU versions format midnight as "24" instead of "00" under
    // hour12: false; normalize back into [0, 23].
    hour: lookup('hour') % 24,
    minute: lookup('minute'),
  }
}

/** Formats an instant as wall-clock components in the given IANA time zone. */
export function utcToZonedWallClock(
  date: Date,
  timeZoneId: string,
): WallClockComponents {
  return getZonedParts(date, timeZoneId)
}

/**
 * Converts wall-clock components, interpreted as local time in the given
 * IANA time zone, to the instant (UTC) they represent.
 *
 * Standard Intl-only technique: format a first guess (treating the wall
 * clock as if it were UTC) in the target zone, measure how far that's off,
 * and correct by the difference. One correction pass is enough for all
 * real-world zones (offsets are stable within the surrounding hour, well
 * away from the DST-transition instant itself).
 */
export function zonedWallClockToUtc(
  components: WallClockComponents,
  timeZoneId: string,
): Date {
  const utcGuessMs = Date.UTC(
    components.year,
    components.month - 1,
    components.day,
    components.hour,
    components.minute,
  )
  const zonedParts = getZonedParts(new Date(utcGuessMs), timeZoneId)
  const zonedAsUtcMs = Date.UTC(
    zonedParts.year,
    zonedParts.month - 1,
    zonedParts.day,
    zonedParts.hour,
    zonedParts.minute,
  )
  const offsetMs = zonedAsUtcMs - utcGuessMs
  return new Date(utcGuessMs - offsetMs)
}
