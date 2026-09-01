import { describe, expect, it } from 'vitest'
import {
  createInitialSyncState,
  markLocalSceneDirty,
  markSyncFailed,
  markSyncStarted,
  markSyncSucceeded,
} from './syncState'

describe('syncState', () => {
  it('starts from local-first idle state so unauthenticated use still works', () => {
    expect(createInitialSyncState()).toEqual({
      status: 'idle',
      sourceOfTruth: 'local',
      lastSyncedAtIso: null,
      hasPendingLocalChange: false,
      error: null,
    })
  })

  it('tracks pending local edits until cloud sync succeeds', () => {
    const dirty = markLocalSceneDirty(createInitialSyncState())
    expect(dirty).toEqual({
      status: 'pending-upload',
      sourceOfTruth: 'local',
      lastSyncedAtIso: null,
      hasPendingLocalChange: true,
      error: null,
    })

    expect(markSyncStarted(dirty, 'syncing')).toEqual({
      status: 'syncing',
      sourceOfTruth: 'local',
      lastSyncedAtIso: null,
      hasPendingLocalChange: true,
      error: null,
    })

    expect(markSyncSucceeded('cloud', '2026-09-01T12:00:00.000Z')).toEqual({
      status: 'idle',
      sourceOfTruth: 'cloud',
      lastSyncedAtIso: '2026-09-01T12:00:00.000Z',
      hasPendingLocalChange: false,
      error: null,
    })
  })

  it('preserves pending state when a sync attempt fails', () => {
    expect(
      markSyncFailed(
        markSyncStarted(markLocalSceneDirty(createInitialSyncState()), 'migrating'),
        'cloud-write-failed',
      ),
    ).toEqual({
      status: 'error',
      sourceOfTruth: 'local',
      lastSyncedAtIso: null,
      hasPendingLocalChange: true,
      error: 'cloud-write-failed',
    })
  })
})
