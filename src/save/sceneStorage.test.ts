import { describe, expect, it, vi } from 'vitest'
import {
  SAVED_SCENE_STORAGE_KEY,
  loadSceneFromStorage,
  saveSceneToStorage,
} from './sceneStorage'
import { createPersistedSceneState } from './sceneState'

function createScene() {
  return createPersistedSceneState(
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
        azimuthDegrees: 180,
        altitudeDegrees: 20,
        fovDegrees: 70,
      },
      display: {
        isProjectorMode: false,
        isNightModeUi: false,
      },
    },
    new Date('2026-08-31T13:00:00.000Z'),
  )
}

describe('sceneStorage', () => {
  it('saves and loads a persisted scene through storage', () => {
    const storage = window.localStorage
    storage.clear()

    const scene = createScene()
    expect(saveSceneToStorage(storage, scene)).toEqual({
      ok: true,
      error: null,
    })
    expect(loadSceneFromStorage(storage)).toEqual(scene)
    expect(storage.getItem(SAVED_SCENE_STORAGE_KEY)).not.toBeNull()
  })

  it('reports unavailable storage', () => {
    expect(saveSceneToStorage(undefined, createScene())).toEqual({
      ok: false,
      error: 'storage-unavailable',
    })
    expect(loadSceneFromStorage(undefined)).toBeNull()
  })

  it('reports write failures without throwing', () => {
    const failingStorage = {
      setItem: vi.fn(() => {
        throw new Error('quota')
      }),
      getItem: vi.fn(),
    } as unknown as Storage

    expect(saveSceneToStorage(failingStorage, createScene())).toEqual({
      ok: false,
      error: 'write-failed',
    })
  })

  it('treats malformed stored data as absent', () => {
    const storage = window.localStorage
    storage.clear()
    storage.setItem(SAVED_SCENE_STORAGE_KEY, 'bad json')

    expect(loadSceneFromStorage(storage)).toBeNull()
  })
})
