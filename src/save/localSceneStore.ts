import {
  loadSceneFromStorage,
  saveSceneToStorage,
  type SaveSceneResult,
} from './sceneStorage'
import type { PersistedSceneStateV1 } from './sceneState'
import type {
  SceneStore,
  SceneStoreReadResult,
  SceneStoreWriteResult,
} from '../sync/sceneRepository'

function toWriteResult(result: SaveSceneResult): SceneStoreWriteResult {
  if (result.ok) {
    return { ok: true, error: null }
  }

  return {
    ok: false,
    error: result.error,
  }
}

export function createLocalSceneStore(
  storage: Storage | undefined,
): SceneStore {
  return {
    kind: 'local',
    async loadScene(): Promise<SceneStoreReadResult> {
      if (!storage) {
        return { scene: null, error: 'storage-unavailable' }
      }

      try {
        const scene = loadSceneFromStorage(storage)
        return {
          scene,
          error: scene ? null : 'not-found',
        }
      } catch {
        return {
          scene: null,
          error: 'read-failed',
        }
      }
    },
    async saveScene(scene: PersistedSceneStateV1): Promise<SceneStoreWriteResult> {
      return toWriteResult(saveSceneToStorage(storage, scene))
    },
  }
}
