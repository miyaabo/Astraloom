export type SyncStatus =
  | 'idle'
  | 'pending-upload'
  | 'syncing'
  | 'migrating'
  | 'error'

export type SyncSource = 'local' | 'cloud' | null

export interface SyncState {
  status: SyncStatus
  sourceOfTruth: SyncSource
  lastSyncedAtIso: string | null
  hasPendingLocalChange: boolean
  error:
    | 'offline'
    | 'local-read-failed'
    | 'local-write-failed'
    | 'cloud-read-failed'
    | 'cloud-write-failed'
    | 'migration-failed'
    | null
}

export function createInitialSyncState(): SyncState {
  return {
    status: 'idle',
    sourceOfTruth: 'local',
    lastSyncedAtIso: null,
    hasPendingLocalChange: false,
    error: null,
  }
}

export function markLocalSceneDirty(state: SyncState): SyncState {
  return {
    ...state,
    status: 'pending-upload',
    hasPendingLocalChange: true,
    error: null,
  }
}

export function markSyncStarted(
  state: SyncState,
  mode: 'syncing' | 'migrating',
): SyncState {
  return {
    ...state,
    status: mode,
    error: null,
  }
}

export function markSyncSucceeded(
  sourceOfTruth: Exclude<SyncSource, null>,
  syncedAtIso: string,
): SyncState {
  return {
    status: 'idle',
    sourceOfTruth,
    lastSyncedAtIso: syncedAtIso,
    hasPendingLocalChange: false,
    error: null,
  }
}

export function markSyncFailed(
  state: SyncState,
  error: NonNullable<SyncState['error']>,
): SyncState {
  return {
    ...state,
    status: 'error',
    error,
  }
}
