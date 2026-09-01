import type { PersistedSceneStateV1 } from '../save/sceneState'

export type SceneStoreKind = 'local' | 'cloud'

export interface SceneStoreReadResult {
  scene: PersistedSceneStateV1 | null
  error:
    | 'storage-unavailable'
    | 'offline'
    | 'read-failed'
    | 'auth-required'
    | 'not-found'
    | null
}

export interface SceneStoreWriteResult {
  ok: boolean
  error:
    | 'storage-unavailable'
    | 'offline'
    | 'write-failed'
    | 'auth-required'
    | null
}

export interface SceneStore {
  kind: SceneStoreKind
  loadScene(): Promise<SceneStoreReadResult>
  saveScene(scene: PersistedSceneStateV1): Promise<SceneStoreWriteResult>
}

export interface SceneConflictResolution {
  preferredSource: SceneStoreKind | null
  scene: PersistedSceneStateV1 | null
  requiresLocalOverwrite: boolean
}

export interface SceneSyncRepository {
  localStore: SceneStore
  cloudStore: SceneStore
  resolveConflict(args: {
    localScene: PersistedSceneStateV1 | null
    cloudScene: PersistedSceneStateV1 | null
  }): SceneConflictResolution
}

export function resolveSceneConflict(args: {
  localScene: PersistedSceneStateV1 | null
  cloudScene: PersistedSceneStateV1 | null
}): SceneConflictResolution {
  const { localScene, cloudScene } = args
  if (!localScene && !cloudScene) {
    return {
      preferredSource: null,
      scene: null,
      requiresLocalOverwrite: false,
    }
  }

  if (localScene && !cloudScene) {
    return {
      preferredSource: 'local',
      scene: localScene,
      requiresLocalOverwrite: false,
    }
  }

  if (!localScene && cloudScene) {
    return {
      preferredSource: 'cloud',
      scene: cloudScene,
      requiresLocalOverwrite: true,
    }
  }

  const resolvedLocalScene = localScene!
  const resolvedCloudScene = cloudScene!
  const localSavedAt = Date.parse(resolvedLocalScene.savedAtIso)
  const cloudSavedAt = Date.parse(resolvedCloudScene.savedAtIso)

  if (localSavedAt > cloudSavedAt) {
    return {
      preferredSource: 'local',
      scene: resolvedLocalScene,
      requiresLocalOverwrite: false,
    }
  }

  return {
    preferredSource: 'cloud',
    scene: resolvedCloudScene,
    requiresLocalOverwrite: true,
  }
}

export function createSceneSyncRepository(args: {
  localStore: SceneStore
  cloudStore: SceneStore
}): SceneSyncRepository {
  return {
    localStore: args.localStore,
    cloudStore: args.cloudStore,
    resolveConflict: resolveSceneConflict,
  }
}
