import { describe, expect, it, vi } from 'vitest'
import { createPersistedSceneState } from '../save/sceneState'
import {
  createSupabaseSceneStoreFromClient,
  readSupabaseSceneStoreConfig,
} from './supabaseSceneStore'

function createScene(savedAtIso = '2026-09-01T10:00:00.000Z') {
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

function createSupabaseSceneStoreClient(args?: {
  userId?: string | null
  row?: ReturnType<typeof createScene> | null
  readError?: unknown
  writeError?: unknown
  authError?: unknown
}) {
  const maybeSingle = vi.fn(async () => {
    if (args?.readError) {
      return { data: null, error: args.readError }
    }

    return {
      data: args?.row
        ? {
            user_id: args.userId ?? 'user-123',
            scene_version: args.row.version,
            scene_payload: args.row.scene,
            saved_at_iso: args.row.savedAtIso,
          }
        : null,
      error: null,
    }
  })
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const upsert = vi.fn(async () => ({ error: args?.writeError ?? null }))

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user:
            args?.userId === null
              ? null
              : {
                  id: args?.userId ?? 'user-123',
                },
        },
        error: args?.authError ?? null,
      })),
    },
    from: vi.fn(() => ({
      select,
      upsert,
    })),
    select,
    eq,
    maybeSingle,
    upsert,
  }
}

describe('supabaseSceneStore', () => {
  it('reads config from env and falls back to the default table name', () => {
    expect(
      readSupabaseSceneStoreConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      tableName: 'scene_snapshots',
    })

    expect(
      readSupabaseSceneStoreConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toBeNull()
  })

  it('loads a cloud snapshot for the authenticated user', async () => {
    const client = createSupabaseSceneStoreClient({
      row: createScene(),
    })
    const store = createSupabaseSceneStoreFromClient(client, 'scene_snapshots')

    expect(await store.loadScene()).toEqual({
      scene: createScene(),
      error: null,
    })
    expect(client.from).toHaveBeenCalledWith('scene_snapshots')
  })

  it('returns auth-required when no signed-in user exists', async () => {
    const client = createSupabaseSceneStoreClient({
      userId: null,
    })
    const store = createSupabaseSceneStoreFromClient(client, 'scene_snapshots')

    expect(await store.loadScene()).toEqual({
      scene: null,
      error: 'auth-required',
    })
    expect(await store.saveScene(createScene())).toEqual({
      ok: false,
      error: 'auth-required',
    })
  })

  it('maps offline and read/write failures to safe repository errors', async () => {
    const previousOnline = navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    const offlineStore = createSupabaseSceneStoreFromClient(
      createSupabaseSceneStoreClient(),
      'scene_snapshots',
    )
    expect(await offlineStore.loadScene()).toEqual({
      scene: null,
      error: 'offline',
    })
    expect(await offlineStore.saveScene(createScene())).toEqual({
      ok: false,
      error: 'offline',
    })

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: previousOnline,
    })

    const failingReadStore = createSupabaseSceneStoreFromClient(
      createSupabaseSceneStoreClient({
        readError: new Error('db read failed'),
      }),
      'scene_snapshots',
    )
    expect(await failingReadStore.loadScene()).toEqual({
      scene: null,
      error: 'read-failed',
    })

    const failingWriteStore = createSupabaseSceneStoreFromClient(
      createSupabaseSceneStoreClient({
        writeError: new Error('db write failed'),
      }),
      'scene_snapshots',
    )
    expect(await failingWriteStore.saveScene(createScene())).toEqual({
      ok: false,
      error: 'write-failed',
    })
  })

  it('treats missing rows and malformed rows as safe load failures', async () => {
    const missingStore = createSupabaseSceneStoreFromClient(
      createSupabaseSceneStoreClient(),
      'scene_snapshots',
    )
    expect(await missingStore.loadScene()).toEqual({
      scene: null,
      error: 'not-found',
    })

    const malformedStore = createSupabaseSceneStoreFromClient(
      createSupabaseSceneStoreClient({
        row: {
          ...createScene(),
          scene: {
            ...createScene().scene,
            dateIso: 'invalid',
          },
        },
      }),
      'scene_snapshots',
    )
    expect(await malformedStore.loadScene()).toEqual({
      scene: null,
      error: 'read-failed',
    })
  })

  it('writes the canonical persisted scene contract via upsert', async () => {
    const client = createSupabaseSceneStoreClient()
    const store = createSupabaseSceneStoreFromClient(client, 'scene_snapshots')
    const scene = createScene('2026-09-01T12:00:00.000Z')

    expect(await store.saveScene(scene)).toEqual({
      ok: true,
      error: null,
    })
    expect(client.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-123',
        scene_version: scene.version,
        scene_payload: scene.scene,
        saved_at_iso: scene.savedAtIso,
      },
      {
        onConflict: 'user_id',
      },
    )
  })
})
