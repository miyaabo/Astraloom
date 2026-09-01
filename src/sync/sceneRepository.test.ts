import { describe, expect, it } from 'vitest'
import { createPersistedSceneState } from '../save/sceneState'
import { createLocalSceneStore } from '../save/localSceneStore'
import {
  createSceneSyncRepository,
  resolveSceneConflict,
} from './sceneRepository'

function createScene(savedAtIso: string) {
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
        mode: 'standard',
        visualPreset: 'planetarium-like',
        isProjectorMode: false,
      },
    },
    new Date(savedAtIso),
  )
}

describe('sceneRepository', () => {
  it('resolves conflict with newer snapshot winning and cloud winning ties', () => {
    const local = createScene('2026-09-01T10:00:00.000Z')
    const newerCloud = createScene('2026-09-01T11:00:00.000Z')
    const sameTimeCloud = createScene('2026-09-01T10:00:00.000Z')

    expect(
      resolveSceneConflict({
        localScene: local,
        cloudScene: newerCloud,
      }),
    ).toEqual({
      preferredSource: 'cloud',
      scene: newerCloud,
      requiresLocalOverwrite: true,
    })

    expect(
      resolveSceneConflict({
        localScene: local,
        cloudScene: sameTimeCloud,
      }),
    ).toEqual({
      preferredSource: 'cloud',
      scene: sameTimeCloud,
      requiresLocalOverwrite: true,
    })
  })

  it('keeps local data when cloud is empty', () => {
    const local = createScene('2026-09-01T10:00:00.000Z')

    expect(
      resolveSceneConflict({
        localScene: local,
        cloudScene: null,
      }),
    ).toEqual({
      preferredSource: 'local',
      scene: local,
      requiresLocalOverwrite: false,
    })
  })

  it('adapts existing localStorage save code behind the shared scene store interface', async () => {
    window.localStorage.clear()
    const store = createLocalSceneStore(window.localStorage)
    const scene = createScene('2026-09-01T10:00:00.000Z')

    expect(await store.loadScene()).toEqual({
      scene: null,
      error: 'not-found',
    })

    expect(await store.saveScene(scene)).toEqual({
      ok: true,
      error: null,
    })

    expect(await store.loadScene()).toEqual({
      scene,
      error: null,
    })
  })

  it('builds a repository from local and cloud stores without coupling save code to cloud details', () => {
    const localStore = createLocalSceneStore(undefined)
    const cloudStore = {
      kind: 'cloud' as const,
      loadScene: async () => ({ scene: null, error: 'auth-required' as const }),
      saveScene: async () => ({ ok: false, error: 'auth-required' as const }),
    }

    const repository = createSceneSyncRepository({
      localStore,
      cloudStore,
    })

    expect(repository.localStore.kind).toBe('local')
    expect(repository.cloudStore.kind).toBe('cloud')
  })
})
