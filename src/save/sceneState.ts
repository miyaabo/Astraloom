import type { ObserverLocation } from '../astronomy/coordinates'
import {
  createInitialDisplayState,
  type DisplayMode,
  type DisplayState,
} from '../displayState'
import { clamp, normalizeDegrees } from '../mathUtils'
import type { PlaybackDirection } from '../playback/playbackTime'
import {
  starfieldConfig,
  type StarfieldVisualPresetKey,
} from '../stars/starfieldConfig'

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
  mode: DisplayMode
  visualPreset: StarfieldVisualPresetKey
  isProjectorMode: boolean
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
  displayState: Pick<DisplayState, 'mode' | 'visualPreset' | 'isProjectorMode'>
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
      mode: input.displayState.mode,
      visualPreset: input.displayState.visualPreset,
      isProjectorMode: input.displayState.isProjectorMode,
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
    if (typeof parsed.savedAtIso !== 'string' || !isIsoDateString(parsed.savedAtIso)) {
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
    mode: scene.display.mode,
    visualPreset: scene.display.visualPreset,
    isProjectorMode: scene.display.isProjectorMode,
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
  if (!isDisplayMode(raw.mode)) return null
  if (!isVisualPresetKey(raw.visualPreset)) return null
  if (typeof raw.isProjectorMode !== 'boolean') return null

  return {
    mode: raw.mode,
    visualPreset: raw.visualPreset,
    isProjectorMode: raw.isProjectorMode,
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
      mode: scene.display.mode,
      visualPreset: scene.display.visualPreset,
      isProjectorMode: scene.display.isProjectorMode,
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

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'standard' || value === 'immersive'
}

function isVisualPresetKey(value: unknown): value is StarfieldVisualPresetKey {
  return typeof value === 'string' && value in starfieldConfig.presets
}
