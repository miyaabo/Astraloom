import type { ObserverLocation } from '../astronomy/coordinates'
import { createInitialDisplayState, type DisplayState } from '../displayState'
import { clamp, normalizeDegrees } from '../mathUtils'
import type { PlaybackDirection } from '../playback/playbackTime'
import { starfieldConfig } from '../stars/starfieldConfig'

export const PERSISTED_SCENE_STATE_VERSION = 1

export interface SavedSceneLocation {
  latitudeDegrees: number
  longitudeDegrees: number
  timeZoneId: string
  label: string | null
}

export interface SavedScenePlayback {
  speedMagnitude: number
  direction: PlaybackDirection
}

export interface SavedSceneView {
  azimuthDegrees: number
  altitudeDegrees: number
  fovDegrees: number
}

export interface SavedSceneDisplay {
  isProjectorMode: boolean
  /**
   * Night Mode UI (10次 Task 6): added after version 1 shipped, so parsing
   * treats it as additive — missing/invalid values fall back to `false`
   * instead of rejecting the whole payload (see parseSavedSceneDisplay).
   */
  isNightModeUi: boolean
}

export interface SavedSceneState {
  dateIso: string
  location: SavedSceneLocation
  playback: SavedScenePlayback
  view: SavedSceneView
  display: SavedSceneDisplay
}

export interface PersistedSceneStateV1 {
  version: typeof PERSISTED_SCENE_STATE_VERSION
  savedAtIso: string
  scene: SavedSceneState
}

export interface SceneSnapshotInput {
  date: Date
  location: ObserverLocation
  timeZoneId: string
  locationLabel: string | null
  speedMagnitude: number
  direction: PlaybackDirection
  displayState: Pick<DisplayState, 'isProjectorMode' | 'isNightModeUi'>
  view: SavedSceneView
}

export function createSavedSceneSnapshot(
  input: SceneSnapshotInput,
): SavedSceneState {
  return normalizeSavedSceneState({
    dateIso: input.date.toISOString(),
    location: {
      latitudeDegrees: input.location.latitudeDegrees,
      longitudeDegrees: input.location.longitudeDegrees,
      timeZoneId: input.timeZoneId,
      label: input.locationLabel,
    },
    playback: {
      speedMagnitude: input.speedMagnitude,
      direction: input.direction,
    },
    view: input.view,
    display: {
      isProjectorMode: input.displayState.isProjectorMode,
      isNightModeUi: input.displayState.isNightModeUi,
    },
  })
}

export function createPersistedSceneState(
  scene: SavedSceneState,
  savedAt: Date = new Date(),
): PersistedSceneStateV1 {
  return {
    version: PERSISTED_SCENE_STATE_VERSION,
    savedAtIso: savedAt.toISOString(),
    scene: normalizeSavedSceneState(scene),
  }
}

export function serializePersistedSceneState(
  persisted: PersistedSceneStateV1,
): string {
  return JSON.stringify({
    ...persisted,
    scene: normalizeSavedSceneState(persisted.scene),
  })
}

export function parsePersistedSceneState(
  raw: string,
): PersistedSceneStateV1 | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if (parsed.version !== PERSISTED_SCENE_STATE_VERSION) return null
    if (
      typeof parsed.savedAtIso !== 'string' ||
      !isIsoDateString(parsed.savedAtIso)
    ) {
      return null
    }
    const scene = parseSavedSceneState(parsed.scene)
    if (!scene) return null
    return {
      version: PERSISTED_SCENE_STATE_VERSION,
      savedAtIso: parsed.savedAtIso,
      scene,
    }
  } catch {
    return null
  }
}

export function createDisplayStateFromSavedScene(
  scene: SavedSceneState,
): DisplayState {
  const initial = createInitialDisplayState()
  return {
    ...initial,
    isProjectorMode: scene.display.isProjectorMode,
    isNightModeUi: scene.display.isNightModeUi,
  }
}

function parseSavedSceneState(raw: unknown): SavedSceneState | null {
  if (!isRecord(raw)) return null
  if (typeof raw.dateIso !== 'string' || !isIsoDateString(raw.dateIso)) {
    return null
  }
  const location = parseSavedSceneLocation(raw.location)
  const playback = parseSavedScenePlayback(raw.playback)
  const view = parseSavedSceneView(raw.view)
  const display = parseSavedSceneDisplay(raw.display)
  if (!location || !playback || !view || !display) return null

  return normalizeSavedSceneState({
    dateIso: raw.dateIso,
    location,
    playback,
    view,
    display,
  })
}

function parseSavedSceneLocation(raw: unknown): SavedSceneLocation | null {
  if (!isRecord(raw)) return null
  if (
    typeof raw.latitudeDegrees !== 'number' ||
    typeof raw.longitudeDegrees !== 'number' ||
    typeof raw.timeZoneId !== 'string'
  ) {
    return null
  }
  if (raw.label !== null && typeof raw.label !== 'string') return null

  return {
    latitudeDegrees: clamp(raw.latitudeDegrees, -90, 90),
    longitudeDegrees: clamp(raw.longitudeDegrees, -180, 180),
    timeZoneId: raw.timeZoneId,
    label: raw.label,
  }
}

function parseSavedScenePlayback(raw: unknown): SavedScenePlayback | null {
  if (!isRecord(raw)) return null
  if (typeof raw.speedMagnitude !== 'number') return null
  if (raw.direction !== 1 && raw.direction !== -1) return null

  return {
    speedMagnitude: clamp(raw.speedMagnitude, 1, 86_400),
    direction: raw.direction,
  }
}

function parseSavedSceneView(raw: unknown): SavedSceneView | null {
  if (!isRecord(raw)) return null
  if (
    typeof raw.azimuthDegrees !== 'number' ||
    typeof raw.altitudeDegrees !== 'number' ||
    typeof raw.fovDegrees !== 'number'
  ) {
    return null
  }

  return normalizeView({
    azimuthDegrees: raw.azimuthDegrees,
    altitudeDegrees: raw.altitudeDegrees,
    fovDegrees: raw.fovDegrees,
  })
}

function parseSavedSceneDisplay(raw: unknown): SavedSceneDisplay | null {
  if (!isRecord(raw)) return null
  if (typeof raw.isProjectorMode !== 'boolean') return null

  return {
    isProjectorMode: raw.isProjectorMode,
    // `mode` from pre-#15 data is intentionally ignored: the retired
    // immersive mode now restores as the standard auto-hiding UI.
    // isNightModeUi is additive (10次 Task 6): absent in data saved before Night Mode
    // UI shipped, so a missing/invalid value falls back to false instead of
    // rejecting the whole payload.
    isNightModeUi: raw.isNightModeUi === true,
    // visualPreset removed (D030): a stray visualPreset key from data saved
    // before the preset feature was abolished is simply not read here, not
    // rejected — the payload still parses successfully.
  }
}

function normalizeSavedSceneState(scene: SavedSceneState): SavedSceneState {
  return {
    dateIso: scene.dateIso,
    location: {
      latitudeDegrees: clamp(scene.location.latitudeDegrees, -90, 90),
      longitudeDegrees: clamp(scene.location.longitudeDegrees, -180, 180),
      timeZoneId: scene.location.timeZoneId,
      label: scene.location.label,
    },
    playback: {
      speedMagnitude: clamp(scene.playback.speedMagnitude, 1, 86_400),
      direction: scene.playback.direction,
    },
    view: normalizeView(scene.view),
    display: {
      isProjectorMode: scene.display.isProjectorMode,
      isNightModeUi: scene.display.isNightModeUi,
    },
  }
}

function normalizeView(view: SavedSceneView): SavedSceneView {
  return {
    azimuthDegrees: normalizeDegrees(view.azimuthDegrees),
    altitudeDegrees: clamp(
      view.altitudeDegrees,
      -starfieldConfig.controls.drag.pitchLimitDegrees,
      starfieldConfig.controls.drag.pitchLimitDegrees,
    ),
    fovDegrees: clamp(
      view.fovDegrees,
      starfieldConfig.controls.zoom.minFovDegrees,
      starfieldConfig.controls.zoom.maxFovDegrees,
    ),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value))
}
