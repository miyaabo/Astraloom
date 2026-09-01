import type { PersistedSceneStateV1 } from './sceneState'
import {
  parsePersistedSceneState,
  serializePersistedSceneState,
} from './sceneState'

export const SAVED_SCENE_STORAGE_KEY = 'veluna.savedScene.v1'

export interface SaveSceneResult {
  ok: boolean
  error: 'storage-unavailable' | 'write-failed' | null
}

export function saveSceneToStorage(
  storage: Storage | undefined,
  scene: PersistedSceneStateV1,
): SaveSceneResult {
  if (!storage) {
    return { ok: false, error: 'storage-unavailable' }
  }

  try {
    storage.setItem(
      SAVED_SCENE_STORAGE_KEY,
      serializePersistedSceneState(scene),
    )
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'write-failed' }
  }
}

export function loadSceneFromStorage(
  storage: Storage | undefined,
): PersistedSceneStateV1 | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(SAVED_SCENE_STORAGE_KEY)
    if (raw === null) return null
    return parsePersistedSceneState(raw)
  } catch {
    return null
  }
}
