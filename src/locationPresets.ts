import type { ObserverLocation } from './astronomy/coordinates'

/**
 * Curated location list for the Task 6 place-picker overlay. A limited city
 * list (rather than free-form latitude/longitude input) per the Task 6
 * decision in docs/features/phase-1-implementation-tasks.md; direct lat/lng
 * entry is deferred to a later task. No geocoding — out of scope for 1次
 * (phase-1-real-sky.md).
 */
export interface LocationPreset {
  name: string
  location: ObserverLocation
  /**
   * IANA time zone identifier for this location, used to interpret and
   * display the date/time overlay in the observer's local time rather than
   * the browser's (Task 7 — see src/civilTime.ts).
   */
  timeZoneId: string
}

export const locationPresets: LocationPreset[] = [
  {
    name: '東京',
    location: { latitudeDegrees: 35.6762, longitudeDegrees: 139.6503 },
    timeZoneId: 'Asia/Tokyo',
  },
  {
    name: '札幌',
    location: { latitudeDegrees: 43.0642, longitudeDegrees: 141.3469 },
    timeZoneId: 'Asia/Tokyo',
  },
  {
    name: '那覇',
    location: { latitudeDegrees: 26.2124, longitudeDegrees: 127.6809 },
    timeZoneId: 'Asia/Tokyo',
  },
  {
    name: 'ニューヨーク',
    location: { latitudeDegrees: 40.7128, longitudeDegrees: -74.006 },
    timeZoneId: 'America/New_York',
  },
  {
    name: 'ロンドン',
    location: { latitudeDegrees: 51.5074, longitudeDegrees: -0.1278 },
    timeZoneId: 'Europe/London',
  },
  {
    name: 'シドニー',
    location: { latitudeDegrees: -33.8688, longitudeDegrees: 151.2093 },
    timeZoneId: 'Australia/Sydney',
  },
]

/** Finds the preset matching a location's coordinates, falling back to the first preset if none match (e.g. a not-yet-preset-backed location). */
export function findLocationPreset(location: ObserverLocation): LocationPreset {
  return (
    locationPresets.find(
      (preset) =>
        preset.location.latitudeDegrees === location.latitudeDegrees &&
        preset.location.longitudeDegrees === location.longitudeDegrees,
    ) ?? locationPresets[0]
  )
}
