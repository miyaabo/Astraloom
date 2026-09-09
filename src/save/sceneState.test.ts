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
        isProjectorMode: hiddenOpenPanel.isProjectorMode,
        isNightModeUi: hiddenOpenPanel.isNightModeUi,
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
        isProjectorMode: false,
        isNightModeUi: false,
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
          isProjectorMode: true,
          isNightModeUi: true,
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
            isProjectorMode: false,
            isNightModeUi: true,
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
        isProjectorMode: false,
        isNightModeUi: true,
      },
    })
  })

  it('defaults isNightModeUi to false when parsing a pre-Night-Mode-UI saved scene', () => {
    const parsed = parsePersistedSceneState(
      JSON.stringify({
        version: PERSISTED_SCENE_STATE_VERSION,
        savedAtIso: '2026-08-31T13:00:00.000Z',
        scene: {
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
            mode: 'standard',
            isProjectorMode: false,
            // isNightModeUi intentionally absent — matches data saved before
            // 10次 Task 6 added the field.
          },
        },
      }),
    )

    expect(parsed?.scene.display.isNightModeUi).toBe(false)
  })

  it('ignores a stray visualPreset field from a pre-D030 saved scene', () => {
    const parsed = parsePersistedSceneState(
      JSON.stringify({
        version: PERSISTED_SCENE_STATE_VERSION,
        savedAtIso: '2026-08-31T13:00:00.000Z',
        scene: {
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
            mode: 'standard',
            // visualPreset intentionally present — matches data saved before
            // D030 abolished the preset feature. Should be ignored, not
            // rejected.
            visualPreset: 'gentle-contrast',
            isProjectorMode: false,
            isNightModeUi: false,
          },
        },
      }),
    )

    expect(parsed?.scene.display).toEqual({
      mode: 'standard',
      isProjectorMode: false,
      isNightModeUi: false,
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
        isProjectorMode: true,
        isNightModeUi: true,
      },
    })

    expect(restored).toEqual({
      activePanel: null,
      isControlMenuOpen: false,
      activeControlMenuSection: null,
      isSelectionInfoOpen: false,
      mode: 'immersive',
      chromeVisibility: 'visible',
      isProjectorMode: true,
      isNightModeUi: true,
    })
  })
})
