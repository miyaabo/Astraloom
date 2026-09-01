import type { PersistedSceneStateV1 } from '../save/sceneState'
import type { SceneSyncRepository } from './sceneRepository'

export interface SceneMigrationResult {
  status:
    | 'migrated-to-cloud'
    | 'migrated-to-local'
    | 'already-in-sync'
    | 'skipped-auth-required'
    | 'skipped-offline'
    | 'no-scene'
    | 'failed'
  sourceOfTruth: 'local' | 'cloud' | null
  scene: PersistedSceneStateV1 | null
  error:
    | 'local-read-failed'
    | 'local-write-failed'
    | 'cloud-read-failed'
    | 'cloud-write-failed'
    | 'auth-required'
    | 'offline'
    | null
}

export async function migrateSceneSnapshot(
  repository: SceneSyncRepository,
): Promise<SceneMigrationResult> {
  const localResult = await repository.localStore.loadScene()
  if (localResult.error === 'storage-unavailable' || localResult.error === 'read-failed') {
    return {
      status: 'failed',
      sourceOfTruth: null,
      scene: null,
      error: 'local-read-failed',
    }
  }

  const cloudResult = await repository.cloudStore.loadScene()
  if (cloudResult.error === 'auth-required') {
    return {
      status: 'skipped-auth-required',
      sourceOfTruth: localResult.scene ? 'local' : null,
      scene: localResult.scene,
      error: 'auth-required',
    }
  }
  if (cloudResult.error === 'offline') {
    return {
      status: 'skipped-offline',
      sourceOfTruth: localResult.scene ? 'local' : null,
      scene: localResult.scene,
      error: 'offline',
    }
  }
  if (cloudResult.error === 'read-failed') {
    return {
      status: 'failed',
      sourceOfTruth: localResult.scene ? 'local' : null,
      scene: localResult.scene,
      error: 'cloud-read-failed',
    }
  }

  const resolution = repository.resolveConflict({
    localScene: localResult.scene,
    cloudScene: cloudResult.scene,
  })

  if (!resolution.scene || !resolution.preferredSource) {
    return {
      status: 'no-scene',
      sourceOfTruth: null,
      scene: null,
      error: null,
    }
  }

  if (resolution.preferredSource === 'local') {
    const saveCloudResult = await repository.cloudStore.saveScene(resolution.scene)
    if (!saveCloudResult.ok) {
      return {
        status: saveCloudResult.error === 'offline' ? 'skipped-offline' : 'failed',
        sourceOfTruth: 'local',
        scene: resolution.scene,
        error: mapCloudWriteError(saveCloudResult.error),
      }
    }

    return {
      status: 'migrated-to-cloud',
      sourceOfTruth: 'local',
      scene: resolution.scene,
      error: null,
    }
  }

  if (resolution.requiresLocalOverwrite) {
    const saveLocalResult = await repository.localStore.saveScene(resolution.scene)
    if (!saveLocalResult.ok) {
      return {
        status: 'failed',
        sourceOfTruth: 'cloud',
        scene: resolution.scene,
        error: 'local-write-failed',
      }
    }

    return {
      status: cloudResult.scene ? 'migrated-to-local' : 'already-in-sync',
      sourceOfTruth: 'cloud',
      scene: resolution.scene,
      error: null,
    }
  }

  return {
    status: 'already-in-sync',
    sourceOfTruth: 'cloud',
    scene: resolution.scene,
    error: null,
  }
}

function mapCloudWriteError(
  error: 'storage-unavailable' | 'offline' | 'write-failed' | 'auth-required' | null,
): SceneMigrationResult['error'] {
  if (error === 'offline') return 'offline'
  if (error === 'auth-required') return 'auth-required'
  return 'cloud-write-failed'
}
