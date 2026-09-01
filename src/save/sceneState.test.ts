import { describe, expect, it } from 'vitest'
import { createInitialDisplayState, requestChromeAutoHide, toggleOverlayPanel } from '../displayState'
import {
  createDisplayStateFromSavedScene,
  createPersistedSceneState,
  createSavedSceneSnapshot,
  parsePersistedSceneState,
  PERSISTED_SCENE_STATE_VERSION,
  serializePersistedSceneState,
} from './sceneState'

describe('sceneState', () => {
  it('builds a saved-scene snapshot from runtime state and keeps only restorable fields', () => {
    const hiddenOpenPanel = requestChromeAutoHide(
      toggleOverlayPanel(createInitialDisplayState(), 'search'),
    )
    const snapshot = createSavedSceneSnapshot({
      date: new Date('2026-08-31T12:34:56.000Z'),
      location: {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
      },
      timeZoneId: 'Asia/Tokyo',
      locationLabel: '東京',
      speedMagnitude: 50,
      direction: -1,
      displayState: {
        mode: hiddenOpenPanel.mode,
        visualPreset: hiddenOpenPanel.visualPreset,
        isProjectorMode: hiddenOpenPanel.isProjectorMode,
      },
      view: {
        azimuthDegrees: 361,
        altitudeDegrees: 100,
        fovDegrees: 10,
      },
    })

    expect(snapshot).toEqual({
      dateIso: '2026-08-31T12:34:56.000Z',
      location: {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
        timeZoneId: 'Asia/Tokyo',
        label: '東京',
      },
      playback: {
        speedMagnitude: 50,
        direction: -1,
      },
      view: {
        azimuthDegrees: 1,
        altitudeDegrees: 85,
        fovDegrees: 30,
      },
      display: {
        mode: 'standard',
        visualPreset: 'planetarium-like',
        isProjectorMode: false,
      },
    })
  })

  it('serializes and parses a persisted scene payload', () => {
    const persisted = createPersistedSceneState(
      {
        dateIso: '2026-08-31T12:34:56.000Z',
        location: {
          latitudeDegrees: 35.6762,
          longitudeDegrees: 139.6503,
          timeZoneId: 'Asia/Tokyo',
          label: '東京',
        },
        playback: {
          speedMagnitude: 50,
          direction: 1,
        },
        view: {
          azimuthDegrees: 90,
          altitudeDegrees: 25,
          fovDegrees: 70,
        },
        display: {
          mode: 'immersive',
          visualPreset: 'gentle-contrast',
          isProjectorMode: true,
        },
      },
      new Date('2026-08-31T13:00:00.000Z'),
    )

    const parsed = parsePersistedSceneState(serializePersistedSceneState(persisted))

    expect(parsed).toEqual({
      version: PERSISTED_SCENE_STATE_VERSION,
      savedAtIso: '2026-08-31T13:00:00.000Z',
      scene: persisted.scene,
    })
  })

  it('rejects malformed or unsupported persisted payloads', () => {
    expect(parsePersistedSceneState('not json')).toBeNull()
    expect(
      parsePersistedSceneState(
        JSON.stringify({
          version: 999,
          savedAtIso: '2026-08-31T13:00:00.000Z',
          scene: {},
        }),
      ),
    ).toBeNull()
    expect(
      parsePersistedSceneState(
        JSON.stringify({
          version: PERSISTED_SCENE_STATE_VERSION,
          savedAtIso: 'invalid',
          scene: {},
        }),
      ),
    ).toBeNull()
  })

  it('normalizes restorable ranges when parsing persisted data', () => {
    const parsed = parsePersistedSceneState(
      JSON.stringify({
        version: PERSISTED_SCENE_STATE_VERSION,
        savedAtIso: '2026-08-31T13:00:00.000Z',
        scene: {
          dateIso: '2026-08-31T12:34:56.000Z',
          location: {
            latitudeDegrees: 120,
            longitudeDegrees: -240,
            timeZoneId: 'Asia/Tokyo',
            label: null,
          },
          playback: {
            speedMagnitude: 0.2,
            direction: -1,
          },
          view: {
            azimuthDegrees: -10,
            altitudeDegrees: -120,
            fovDegrees: 200,
          },
          display: {
            mode: 'standard',
            visualPreset: 'planetarium-like',
            isProjectorMode: false,
          },
        },
      }),
    )

    expect(parsed?.scene).toEqual({
      dateIso: '2026-08-31T12:34:56.000Z',
      location: {
        latitudeDegrees: 90,
        longitudeDegrees: -180,
        timeZoneId: 'Asia/Tokyo',
        label: null,
      },
      playback: {
        speedMagnitude: 1,
        direction: -1,
      },
      view: {
        azimuthDegrees: 350,
        altitudeDegrees: -85,
        fovDegrees: 90,
      },
      display: {
        mode: 'standard',
        visualPreset: 'planetarium-like',
        isProjectorMode: false,
      },
    })
  })

  it('rebuilds display state from a saved scene without reviving transient chrome state', () => {
    const restored = createDisplayStateFromSavedScene({
      dateIso: '2026-08-31T12:34:56.000Z',
      location: {
        latitudeDegrees: 35.6762,
        longitudeDegrees: 139.6503,
        timeZoneId: 'Asia/Tokyo',
        label: '東京',
      },
      playback: {
        speedMagnitude: 50,
        direction: 1,
      },
      view: {
        azimuthDegrees: 180,
        altitudeDegrees: 25,
        fovDegrees: 70,
      },
      display: {
        mode: 'immersive',
        visualPreset: 'gentle-contrast',
        isProjectorMode: true,
      },
    })

    expect(restored).toEqual({
      activePanel: null,
      isSelectionInfoOpen: false,
      mode: 'immersive',
      chromeVisibility: 'visible',
      visualPreset: 'gentle-contrast',
      isProjectorMode: true,
    })
  })
})
