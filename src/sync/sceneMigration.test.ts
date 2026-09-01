import { describe, expect, it, vi } from 'vitest'
import { createPersistedSceneState } from '../save/sceneState'
import { createSceneSyncRepository, type SceneStore } from './sceneRepository'
import { migrateSceneSnapshot } from './sceneMigration'

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

function createMemoryStore(initialScene: ReturnType<typeof createScene> | null, kind: 'local' | 'cloud'): SceneStore {
  let scene = initialScene

  return {
    kind,
    async loadScene() {
      return {
        scene,
        error: scene ? null : 'not-found',
      }
    },
    async saveScene(nextScene) {
      scene = nextScene
      return {
        ok: true,
        error: null,
      }
    },
  }
}

describe('sceneMigration', () => {
  it('uploads a local-only snapshot to cloud on first signed-in migration', async () => {
    const localScene = createScene('2026-09-01T10:00:00.000Z')
    const localStore = createMemoryStore(localScene, 'local')
    const cloudStore = createMemoryStore(null, 'cloud')
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'migrated-to-cloud',
      sourceOfTruth: 'local',
      scene: localScene,
      error: null,
    })
    await expect(cloudStore.loadScene()).resolves.toEqual({
      scene: localScene,
      error: null,
    })
  })

  it('restores the newer cloud snapshot back into local storage when local is stale', async () => {
    const localStore = createMemoryStore(createScene('2026-09-01T10:00:00.000Z'), 'local')
    const cloudScene = createScene('2026-09-01T11:00:00.000Z')
    const cloudStore = createMemoryStore(cloudScene, 'cloud')
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'migrated-to-local',
      sourceOfTruth: 'cloud',
      scene: cloudScene,
      error: null,
    })
    await expect(localStore.loadScene()).resolves.toEqual({
      scene: cloudScene,
      error: null,
    })
  })

  it('treats same-timestamp conflicts as cloud-wins and overwrites local', async () => {
    const localStore = createMemoryStore(createScene('2026-09-01T10:00:00.000Z'), 'local')
    const cloudScene = createScene('2026-09-01T10:00:00.000Z')
    const cloudStore = createMemoryStore(cloudScene, 'cloud')
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'migrated-to-local',
      sourceOfTruth: 'cloud',
      scene: cloudScene,
      error: null,
    })
  })

  it('skips migration safely when the user is not signed in', async () => {
    const localScene = createScene('2026-09-01T10:00:00.000Z')
    const localStore = createMemoryStore(localScene, 'local')
    const cloudStore: SceneStore = {
      kind: 'cloud',
      async loadScene() {
        return { scene: null, error: 'auth-required' }
      },
      async saveScene() {
        return { ok: false, error: 'auth-required' }
      },
    }
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'skipped-auth-required',
      sourceOfTruth: 'local',
      scene: localScene,
      error: 'auth-required',
    })
  })

  it('skips migration safely while offline and preserves local use', async () => {
    const localScene = createScene('2026-09-01T10:00:00.000Z')
    const localStore = createMemoryStore(localScene, 'local')
    const cloudStore: SceneStore = {
      kind: 'cloud',
      async loadScene() {
        return { scene: null, error: 'offline' }
      },
      async saveScene() {
        return { ok: false, error: 'offline' }
      },
    }
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'skipped-offline',
      sourceOfTruth: 'local',
      scene: localScene,
      error: 'offline',
    })
  })

  it('surfaces local or cloud failures without deleting usable local data', async () => {
    const localScene = createScene('2026-09-01T10:00:00.000Z')
    const localStore: SceneStore = {
      kind: 'local',
      loadScene: vi.fn(async () => ({ scene: null, error: 'read-failed' as const })),
      saveScene: vi.fn(async () => ({ ok: false, error: 'write-failed' as const })),
    }
    const cloudStore: SceneStore = {
      kind: 'cloud',
      loadScene: vi.fn(async () => ({ scene: localScene, error: null })),
      saveScene: vi.fn(async () => ({ ok: false, error: 'write-failed' as const })),
    }
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'failed',
      sourceOfTruth: null,
      scene: null,
      error: 'local-read-failed',
    })
  })

  it('reports cloud write failures when local should be uploaded', async () => {
    const localScene = createScene('2026-09-01T10:00:00.000Z')
    const localStore = createMemoryStore(localScene, 'local')
    const cloudStore: SceneStore = {
      kind: 'cloud',
      async loadScene() {
        return { scene: null, error: 'not-found' }
      },
      async saveScene() {
        return { ok: false, error: 'write-failed' }
      },
    }
    const repository = createSceneSyncRepository({ localStore, cloudStore })

    await expect(migrateSceneSnapshot(repository)).resolves.toEqual({
      status: 'failed',
      sourceOfTruth: 'local',
      scene: localScene,
      error: 'cloud-write-failed',
    })
  })
})
